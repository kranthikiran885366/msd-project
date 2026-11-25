/**
 * JobExecutor — runs on each worker VM
 * Handles: clone → detect → build → run → report
 * Like Heroku/Render: detached containers, real logs, live URL
 */
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { assertDevelopmentExecutor } = require('./executionPolicy');

class JobExecutor {
    constructor(nodeId, backendUrl) {
        this.nodeId = nodeId;
        this.backendUrl = backendUrl;
        this.workerSecret = process.env.WORKER_SECRET || '';
        this.client = axios.create({
            baseURL: backendUrl,
            timeout: 600000,
            validateStatus: () => true,
            headers: this.workerSecret
                ? { Authorization: `Bearer ${this.workerSecret}` }
                : {}
        });
        this.runningContainers = new Map(); // containerName → { deploymentId, port }
    }

    async executeJob(job) {
        assertDevelopmentExecutor();
        const deploymentId    = job.deploymentId || job.data?.deploymentId || job.id;
        this.currentJobData = job.data || {};
        const repoUrl         = job.data?.repositoryUrl || job.data?.gitUrl || job.repositoryUrl;
        const branch          = job.data?.branch || job.branch || 'main';
        const accessToken     = job.data?.accessToken || process.env.GITHUB_TOKEN;
        const noCache         = job.data?.noCache || job.noCache || false;
        const installCommand  = job.data?.installCommand || '';
        const buildCommand    = job.data?.buildCommand   || '';
        const startCommand    = job.data?.startCommand   || '';
        const outputDirectory = job.data?.outputDirectory|| '';
        const rootDirectory   = job.data?.rootDirectory  || '/';
        const envVariables    = job.data?.envVariables   || {};

        console.log(`[executor] ▶ Job ${deploymentId} | repo: ${repoUrl} | branch: ${branch}`);

        let workspaceDir = null;
        let imageTag     = null;
        let port         = null;
        const containerName = `msd-${String(deploymentId).slice(-12)}`;

        try {
            // ── Step 1: Clone ──────────────────────────────────────────────
            await this.updateStatus(deploymentId, 'building');
            await this.log(deploymentId, `==> Cloning ${repoUrl}@${branch}`, 'info');

            workspaceDir = await this.cloneRepo(deploymentId, repoUrl, branch, accessToken, job.data?.gitCommit);
            const buildDir = await this.resolveRoot(workspaceDir, rootDirectory);

            // ── Step 2: Dockerfile ─────────────────────────────────────────
            await this.log(deploymentId, '==> Detecting project type', 'info');
            await this.ensureDockerfile(deploymentId, buildDir, {
                installCommand, buildCommand, startCommand, outputDirectory
            });

            // ── Step 3: Build image ────────────────────────────────────────
            await this.log(deploymentId, '==> Building Docker image', 'info');
            imageTag = `msd-${String(deploymentId).slice(-12)}:latest`;
            if (noCache) await this.log(deploymentId, '==> Cache disabled (--no-cache)', 'info');
            const buildStarted = Date.now();
            await this.buildImage(deploymentId, buildDir, imageTag, noCache);
            const buildTime = (Date.now() - buildStarted) / 1000;

            // ── Step 4: Allocate port ──────────────────────────────────────
            port = await this.allocatePort(deploymentId);
            await this.log(deploymentId, `==> Allocated port ${port}`, 'info');

            // ── Step 5: Run container (detached, persistent) ───────────────
            await this.updateStatus(deploymentId, 'deploying');
            await this.log(deploymentId, `==> Starting container on port ${port}`, 'info');
            await this.runContainer(deploymentId, imageTag, containerName, port, buildDir, envVariables, job.data?.appPort);

            // ── Step 6: Health check ───────────────────────────────────────
            await this.waitForHealthy(containerName, port, 60000, deploymentId);

            const nodeIp = process.env.NODE_PUBLIC_IP || process.env.NODE_IP || 'localhost';
            // Use localhost if running inside Docker (internal hostnames not reachable from browser)
            const INTERNAL = ['worker', 'backend', 'frontend', 'mongodb', 'redis'];
            const publicIp = INTERNAL.includes(nodeIp) ? 'localhost' : nodeIp;
            const rawUrl = `http://${process.env.RUNTIME_HOST || publicIp}:${port}`;

            // Build a Heroku/Render-style proxy URL through the backend
            // so the browser always gets a stable, reachable URL
            const backendPublic = (process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000')
                .replace(/\/api$/, '');
            // Generate Heroku/Render-style subdomain URL
            // Format: {project-slug}-{short-id}.clouddeck.local → proxied via backend
            const appDomain = process.env.APPS_BASE_DOMAIN || 'localhost';
            if (process.env.NODE_ENV === 'production' && !appDomain) throw new Error('APPS_BASE_DOMAIN is required for isolated production application origins');
            const appUrl = appDomain === 'localhost' ? `http://${deploymentId}.localhost:${process.env.GATEWAY_PUBLIC_PORT || 8080}` : `https://${deploymentId}.${appDomain}`;
            const domain = null;

            await this.log(deploymentId, `==> Container running on port ${port}`, 'info');
            await this.log(deploymentId, `==> App URL: ${appUrl}`, 'info');
            // If a custom domain was requested and verified, prefer it as the public URL
            const customDomain = job.data?.customDomain || null;
            const publicUrl = customDomain ? `https://${customDomain}` : appUrl;
            if (customDomain) await this.log(deploymentId, `==> Assigned custom domain: ${customDomain}`, 'info');
            await this.updateStatus(deploymentId, 'deploying', { rawUrl, localUrl: rawUrl, port, nodeId: this.nodeId });
            await this.verifyIngress(deploymentId, publicUrl);
            await this.updateStatus(deploymentId, 'running', {
                url: publicUrl,
                rawUrl,
                localUrl: rawUrl,
                port, nodeId: this.nodeId,
                domain: customDomain || domain,
                imageTag, gitCommit: this.resolvedCommit, buildTime
            });

            this.runningContainers.set(containerName, { deploymentId, port });
            await this.cleanup(workspaceDir);
            this.currentJobData = null;

            return { deploymentId, status: 'running', url: appUrl };

        } catch (err) {
            console.error(`[executor] ✗ Job ${deploymentId} failed: ${err.message}`);
            await this.log(deploymentId, `==> ✗ ${err.message}`, 'error');
            await this.updateStatus(deploymentId, 'failed', { error: err.message }).catch(() => {});

            await this.exec(null, 'docker', ['rm', '-f', containerName]).catch(() => {});
            if (port) {
                await this.client.post(`/api/ports/${deploymentId}/release`).catch(() => {});
            }
            if (workspaceDir) await this.cleanup(workspaceDir);
            this.currentJobData = null;
            throw err;
        }
    }

    // ── Clone ──────────────────────────────────────────────────────────────────
    async cloneRepo(deploymentId, repoUrl, branch, accessToken, commit = null) {
        if (!repoUrl) throw new Error('No repository URL in job data');

        const url = new URL(repoUrl);
        if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.search || url.hash || !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(url.pathname)) throw new Error('Use an HTTPS GitHub repository URL without credentials');
        if (!/^[a-f\d]{24}$/i.test(String(deploymentId))) throw new Error('Invalid deployment ID');
        const dir = path.join('/tmp', 'msd-builds', String(deploymentId));
        await fs.rm(dir, { recursive: true, force: true });
        await fs.mkdir(dir, { recursive: true });
        const askpass = path.join('/tmp', `msd-askpass-${deploymentId}`);
        try {
            await fs.writeFile(askpass, '#!/bin/sh\ncase "$1" in *Username*) echo x-access-token;; *) printf "%s\n" "$CLOUDDECK_GIT_TOKEN";; esac\n', { mode: 0o700 });
            await this.exec(deploymentId, 'git', ['clone', '--depth', '1', `--branch=${branch}`, '--', repoUrl, dir], {
                env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: askpass, CLOUDDECK_GIT_TOKEN: accessToken || '' }
            });
            if (commit) {
                if (!/^[a-f\d]{40}$/i.test(commit)) throw new Error('A rollback requires a full Git commit SHA');
                await this.exec(deploymentId, 'git', ['-C', dir, 'fetch', '--depth', '1', 'origin', commit], { env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: askpass, CLOUDDECK_GIT_TOKEN: accessToken || '' } });
                await this.exec(deploymentId, 'git', ['-C', dir, 'checkout', '--detach', commit]);
            }
            const { stdout } = await require('util').promisify(require('child_process').execFile)('git', ['-C', dir, 'rev-parse', 'HEAD']);
            this.resolvedCommit = stdout.trim();
            // Never copy Git credential helpers, history or config into build images.
            await fs.rm(path.join(dir, '.git'), { recursive: true, force: true });
        } finally { await fs.rm(askpass, { force: true }); }

        return dir;
    }

    // ── Dockerfile detection & generation ─────────────────────────────────────
    async ensureDockerfile(deploymentId, dir, buildSettings = {}) {
        const {
            installCommand,
            buildCommand,
            startCommand,
            outputDirectory,
        } = buildSettings;

        // Use repo's own Dockerfile if present
        try {
            await fs.access(path.join(dir, 'Dockerfile'));
            await this.log(deploymentId, '==> Using existing Dockerfile', 'info');
            return;
        } catch (_) {}

        const runtime = await this.detectRuntime(dir);
        await this.log(deploymentId, `==> Detected: ${runtime.framework || runtime.type} (${this._runtimeLabel(runtime)})`, 'info');

        const opts = {
            installCommand:   installCommand  || this._defaultInstall(runtime),
            buildCommand:     buildCommand    || this._defaultBuild(runtime),
            startCommand:     startCommand    || this._defaultStart(runtime),
            outputDirectory:  outputDirectory || this._defaultOutput(runtime),
            runtime,
        };

        const dockerfile = this.makeDockerfile(runtime.type, opts);
        await fs.writeFile(path.join(dir, 'Dockerfile'), dockerfile);

        // nginx.conf for SPA types
        if (['react','vue','svelte','astro','static','static-safe','nuxt'].includes(runtime.type)) {
            await fs.writeFile(path.join(dir, 'nginx.conf'),
                `server{listen 80;server_name _;root /usr/share/nginx/html;index index.html;` +
                `location/{try_files $uri $uri/ /index.html;}}`
            );
        }

        if (runtime.type === 'static-safe') throw new Error('No supported runtime or index.html detected. Add a Dockerfile or configure a supported application.');
    }

    async resolveRoot(workspace, rootDirectory) {
        const root = await fs.realpath(workspace);
        const requested = String(rootDirectory || '/').replace(/^\/+/, '');
        const target = await fs.realpath(path.resolve(root, requested));
        if (target !== root && !target.startsWith(root + path.sep)) throw new Error('Root directory must remain inside the repository');
        if (!(await fs.stat(target)).isDirectory()) throw new Error('Root directory is not a directory');
        return target;
    }

    async waitForHealthy(containerName, port, timeout = 60000, deploymentId = null) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (deploymentId) await this.assertActive(deploymentId);
            if (!await this.isRunning(containerName)) throw new Error('Application container exited before becoming ready');
            try {
                const response = await axios.get(`http://${process.env.RUNTIME_HOST || '127.0.0.1'}:${port}/`, { timeout: 2000, maxRedirects: 0, validateStatus: status => status >= 200 && status < 400 });
                if (response) return;
            } catch (_) {}
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error('Application did not become HTTP-ready within 60 seconds');
    }

    _runtimeLabel(r) {
        if (r.type === 'python') return `Python ${r.pythonVersion}`;
        if (r.type === 'go')     return `Go ${r.goVersion}`;
        if (r.type === 'ruby')   return `Ruby ${r.rubyVersion}`;
        if (r.type === 'php')    return `PHP ${r.phpVersion}`;
        return `Node ${r.nodeVersion}`;
    }

    _defaultInstall(r) {
        if (r.packageManager === 'yarn') return 'yarn install --frozen-lockfile';
        if (r.packageManager === 'pnpm') return 'pnpm install --frozen-lockfile';
        if (r.type === 'python') return 'pip install -r requirements.txt';
        if (r.type === 'go')     return 'go mod download';
        if (r.type === 'ruby')   return 'bundle install';
        if (r.type === 'php')    return 'composer install --no-dev';
        return 'npm install';
    }

    _defaultBuild(r) {
        if (['nextjs','react','vue','svelte','astro','nuxt'].includes(r.type)) {
            if (r.packageManager === 'yarn') return 'yarn build';
            if (r.packageManager === 'pnpm') return 'pnpm run build';
            return 'npm run build';
        }
        if (r.type === 'go') return 'go build -o app .';
        return '';
    }

    _defaultStart(r) {
        if (r.type === 'nextjs') {
            if (r.packageManager === 'yarn') return 'yarn start';
            if (r.packageManager === 'pnpm') return 'pnpm start';
            return 'npm start';
        }
        if (r.type === 'node') return r.hasStartScript ? (r.packageManager === 'pnpm' ? 'pnpm start' : r.packageManager === 'yarn' ? 'yarn start' : 'npm start') : `node ${r.mainFile || 'index.js'}`;
        if (r.type === 'python') return 'python app.py';
        if (r.type === 'go')     return './app';
        if (r.type === 'ruby')   return 'bundle exec ruby app.rb';
        if (r.type === 'php')    return 'php -S 0.0.0.0:8080 -t public';
        return '';
    }

    _defaultOutput(r) {
        if (r.type === 'react')  return r.isVite ? 'dist' : 'build';
        if (r.type === 'vue')    return 'dist';
        if (r.type === 'svelte') return 'public';
        if (r.type === 'astro')  return 'dist';
        if (r.type === 'nuxt')   return '.output/public';
        if (r.type === 'nextjs') return '.next';
        return '';
    }

    // ── Dynamic runtime detection (like Render) ─────────────────────────────
    async detectRuntime(dir) {
        const result = {
            type: 'static-safe',
            nodeVersion: '20',
            pythonVersion: '3.11',
            goVersion: '1.22',
            rubyVersion: '3.2',
            phpVersion: '8.2',
            framework: null,
            packageManager: 'npm',
            hasLockFile: { npm: false, yarn: false, pnpm: false },
        };

        // ── Node.js version detection ──────────────────────────────────────
        try {
            const nvmrc = (await fs.readFile(path.join(dir, '.nvmrc'), 'utf8')).trim().replace(/^v/, '');
            if (/^\d/.test(nvmrc)) result.nodeVersion = nvmrc.split('.')[0];
        } catch (_) {}
        try {
            const nv = (await fs.readFile(path.join(dir, '.node-version'), 'utf8')).trim().replace(/^v/, '');
            if (/^\d/.test(nv)) result.nodeVersion = nv.split('.')[0];
        } catch (_) {}

        // ── Package manager detection ──────────────────────────────────────
        try { await fs.access(path.join(dir, 'package-lock.json')); result.hasLockFile.npm  = true; } catch (_) {}
        try { await fs.access(path.join(dir, 'yarn.lock'));          result.hasLockFile.yarn = true; result.packageManager = 'yarn'; } catch (_) {}
        try { await fs.access(path.join(dir, 'pnpm-lock.yaml'));     result.hasLockFile.pnpm = true; result.packageManager = 'pnpm'; } catch (_) {}

        // ── package.json analysis ──────────────────────────────────────────
        try {
            const pkg = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            // Respect engines.node if specified
            if (pkg.engines?.node) {
                const m = pkg.engines.node.match(/(\d+)/);
                if (m) result.nodeVersion = m[1];
            }

            // Framework detection
            result.isVite = Boolean(deps.vite);
            result.hasStartScript = Boolean(pkg.scripts?.start);
            result.mainFile = typeof pkg.main === 'string' && /^[a-zA-Z0-9_./-]+$/.test(pkg.main) ? pkg.main : 'index.js';
            if (deps.next)         { result.type = 'nextjs';  result.framework = 'Next.js'; }
            else if (deps.nuxt)    { result.type = 'nuxt';    result.framework = 'Nuxt'; }
            else if (deps.react)   { result.type = 'react';   result.framework = 'React'; }
            else if (deps.vue)     { result.type = 'vue';     result.framework = 'Vue'; }
            else if (deps.svelte)  { result.type = 'svelte';  result.framework = 'Svelte'; }
            else if (deps.astro)   { result.type = 'astro';   result.framework = 'Astro'; }
            else if (deps.express || deps.fastify || deps.koa || deps.hapi) {
                result.type = 'node'; result.framework = 'Node.js';
            } else {
                result.type = 'node'; result.framework = 'Node.js';
            }
            return result;
        } catch (_) {}

        // ── Python ────────────────────────────────────────────────────────
        try {
            const rt = await fs.readFile(path.join(dir, 'runtime.txt'), 'utf8');
            const m = rt.match(/python-(\d+\.\d+)/);
            if (m) result.pythonVersion = m[1];
        } catch (_) {}
        try { await fs.access(path.join(dir, 'requirements.txt')); result.type = 'python'; result.framework = 'Python'; return result; } catch (_) {}
        try { await fs.access(path.join(dir, 'Pipfile'));           result.type = 'python'; result.framework = 'Python'; return result; } catch (_) {}
        try { await fs.access(path.join(dir, 'pyproject.toml'));    result.type = 'python'; result.framework = 'Python'; return result; } catch (_) {}

        // ── Go ────────────────────────────────────────────────────────────
        try {
            const gomod = await fs.readFile(path.join(dir, 'go.mod'), 'utf8');
            const m = gomod.match(/^go (\d+\.\d+)/m);
            if (m) result.goVersion = m[1];
            result.type = 'go'; result.framework = 'Go'; return result;
        } catch (_) {}

        // ── Ruby ──────────────────────────────────────────────────────────
        try {
            const rv = (await fs.readFile(path.join(dir, '.ruby-version'), 'utf8')).trim();
            if (/^\d/.test(rv)) result.rubyVersion = rv;
        } catch (_) {}
        try { await fs.access(path.join(dir, 'Gemfile')); result.type = 'ruby'; result.framework = 'Ruby'; return result; } catch (_) {}

        // ── PHP ───────────────────────────────────────────────────────────
        try { await fs.access(path.join(dir, 'composer.json')); result.type = 'php'; result.framework = 'PHP'; return result; } catch (_) {}

        // ── Static ────────────────────────────────────────────────────────
        try { await fs.access(path.join(dir, 'index.html')); result.type = 'static'; result.framework = 'Static'; return result; } catch (_) {}

        return result; // static-safe fallback
    }

    async detectType(dir) {
        const r = await this.detectRuntime(dir);
        return r.type;
    }

    makeDockerfile(type, opts = {}) {
        const { installCommand: install, buildCommand: build, startCommand: start, outputDirectory: output, runtime = {} } = opts;
        const node   = runtime.nodeVersion   || '20';
        const python = runtime.pythonVersion || '3.11';
        const goVer  = runtime.goVersion     || '1.22';
        const ruby   = runtime.rubyVersion   || '3.2';
        const php    = runtime.phpVersion    || '8.2';

        const installPkg = runtime.packageManager === 'pnpm'
            ? `RUN npm install -g pnpm && ${install}`
            : runtime.packageManager === 'yarn'
            ? `RUN npm install -g yarn && ${install}`
            : `RUN ${install}`;

        const templates = {
            nextjs: `FROM node:${node}-alpine AS builder
WORKDIR /app
COPY . .
${installPkg}
${build ? `RUN ${build}` : ''}
FROM node:${node}-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["sh","-c","${start}"]`,

            react: `FROM node:${node}-alpine AS builder
WORKDIR /app
COPY . .
${installPkg}
RUN ${build}
FROM nginx:alpine
COPY --from=builder /app/${output || 'build'} /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]`,

            vue: `FROM node:${node}-alpine AS builder
WORKDIR /app
COPY . .
${installPkg}
RUN ${build}
FROM nginx:alpine
COPY --from=builder /app/${output || 'dist'} /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]`,

            svelte: `FROM node:${node}-alpine AS builder
WORKDIR /app
COPY . .
${installPkg}
RUN ${build}
FROM nginx:alpine
COPY --from=builder /app/${output || 'public'} /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]`,

            astro: `FROM node:${node}-alpine AS builder
WORKDIR /app
COPY . .
${installPkg}
RUN ${build}
FROM nginx:alpine
COPY --from=builder /app/${output || 'dist'} /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]`,

            nuxt: `FROM node:${node}-alpine AS builder
WORKDIR /app
COPY . .
${installPkg}
RUN ${build}
FROM node:${node}-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node",".output/server/index.mjs"]`,

            node: `FROM node:${node}-alpine
WORKDIR /app
COPY . .
RUN if [ -f package.json ]; then ${install}; fi
${build ? `RUN ${build}` : ''}
EXPOSE 3000
CMD ["sh","-c","${start || 'node $(node -e \'const p=require(\"./package.json\");console.log(p.main||\"index.js\")\')' }"]`,

            python: `FROM python:${python}-slim
WORKDIR /app
COPY . .
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi
RUN if [ -f Pipfile ]; then pip install pipenv && pipenv install --system --deploy; fi
RUN if [ -f pyproject.toml ]; then pip install --no-cache-dir .; fi
EXPOSE 8000
CMD ["sh","-c","${start || 'if [ -f manage.py ]; then python manage.py runserver 0.0.0.0:8000; elif [ -f app.py ]; then python app.py; elif [ -f main.py ]; then python main.py; else gunicorn app:app; fi'}"]`,

            go: `FROM golang:${goVer}-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN ${build || 'go build -o app .'}
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/app .
EXPOSE 8080
CMD ["./app"]`,

            ruby: `FROM ruby:${ruby}-alpine
WORKDIR /app
RUN apk add --no-cache build-base
COPY . .
RUN bundle install
EXPOSE 3000
CMD ["sh","-c","${start || 'bundle exec rails server -b 0.0.0.0'}"]`,

            php: `FROM php:${php}-apache
WORKDIR /var/www/html
COPY . .
RUN if [ -f composer.json ]; then curl -sS https://getcomposer.org/installer | php && php composer.phar install --no-dev; fi
EXPOSE 80
CMD ["apache2-foreground"]`,

            static: `FROM nginx:alpine
COPY . /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]`,
        };
        templates['static-safe'] = templates.static;
        return templates[type] || templates.node;
    }

    // ── Docker build ───────────────────────────────────────────────────────────
    async buildImage(deploymentId, dir, imageTag, noCache = false) {
        const args = [
            'build', '-t', imageTag,
            '--memory=512m', '--memory-swap=512m',
            '--label', `deployment=${deploymentId}`,
            '--label', 'managed-by=clouddeck',
        ];
        if (noCache) args.push('--no-cache');
        args.push('.');
        await this.exec(deploymentId, 'docker', args, { cwd: dir });
    }

    // ── Run container — DETACHED so it stays alive ─────────────────────────────
    async runContainer(deploymentId, imageTag, containerName, port, workspaceDir, envVariables = {}, configuredPort) {
        // Detect internal port from Dockerfile EXPOSE directive
        let internalPort = 3000;
        try {
            const dfPath = require('path').join(workspaceDir || '/tmp', 'Dockerfile');
            const df = await require('fs').promises.readFile(dfPath, 'utf8').catch(() => '');
            const match = df.match(/EXPOSE\s+(\d+)/i);
            if (match) internalPort = parseInt(match[1], 10);
        } catch (_) {}

        if (configuredPort) internalPort = Number(configuredPort);
        if (!Number.isInteger(internalPort) || internalPort < 1 || internalPort > 65535) throw new Error('Invalid application port');
        const envFile = path.join('/tmp', `msd-env-${deploymentId}`);
        const entries = Object.entries(envVariables);
        for (const [key, value] of entries) if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || /[\r\n\0]/.test(String(value))) throw new Error('Invalid environment variable');
        await fs.writeFile(envFile, entries.map(([key, value]) => `${key}=${value}`).join('\n'), { mode: 0o600 });
        try { await this.exec(deploymentId, 'docker', [
            'run',
            '--security-opt=no-new-privileges',
            '--pids-limit=256',
            '--env-file', envFile,
            '--detach',                        // FIX: was --rm which killed container on exit
            '--name', containerName,
            '--memory=256m',
            '--cpus=0.5',
            '--restart=unless-stopped',        // auto-restart on crash like Render
            '-p', `${port}:${internalPort}`,
            '-e', 'NODE_ENV=production',
            '-e', `PORT=${internalPort}`,
            '--label', `deployment=${deploymentId}`,
            '--label', 'managed-by=clouddeck',
            imageTag
        ]); } finally { await fs.rm(envFile, { force: true }); }
    }

    async isRunning(containerName) {
        return new Promise(resolve => {
            const p = spawn('docker', ['inspect', '--format', '{{.State.Running}}', containerName]);
            let out = '';
            p.stdout.on('data', d => out += d.toString());
            p.on('close', () => resolve(out.trim() === 'true'));
            p.on('error', () => resolve(false));
        });
    }

    // ── Port allocation ────────────────────────────────────────────────────────
    async allocatePort(deploymentId) {
        const reservedPorts = new Set([3000, 3001, 4000]);

        try {
            const payload = { deploymentId, nodeId: this.nodeId };
            if (this.currentJobData && this.currentJobData.customDomain) payload.subdomain = this.currentJobData.customDomain;
            const res = await this.client.post('/api/ports/allocate', payload);
            const allocated = Number(res.data?.port);
            if (allocated && !reservedPorts.has(allocated)) {
                return allocated;
            }
        } catch (_) {}

        throw new Error('Port allocation failed; refusing an unreserved port');
    }

    // ── Status update — tries PATCH first (correct route), falls back to POST ──
    async updateStatus(deploymentId, status, extras = {}) {
        const body = { status, ...extras };
        const res = await this.client.post(`/api/deployments/${deploymentId}/status`, body);
        if (res.status >= 400) throw new Error(`Status callback rejected (${res.status})`);
    }

    // ── Log append ─────────────────────────────────────────────────────────────
    async log(deploymentId, message, level = 'info') {
        let trimmed = String(message).trim();
        const values = [process.env.WORKER_SECRET, this.currentJobData?.accessToken, ...Object.values(this.currentJobData?.envVariables || {})].filter(v => typeof v === 'string' && v.length > 3);
        for (const value of values) trimmed = trimmed.split(value).join('[REDACTED]');
        if (!trimmed) return;
        console.log(`[executor][${level}] ${trimmed}`);
        await this.client.post(`/api/deployments/${deploymentId}/logs`, {
            message: trimmed,
            level,
            timestamp: new Date()
        }).catch(() => {}); // non-fatal
    }

    async verifyIngress(deploymentId, publicUrl) {
        const url = new URL(publicUrl);
        const internal = process.env.NODE_ENV !== 'production' && process.env.GATEWAY_INTERNAL_URL;
        const target = internal || url.href;
        const response = await axios.get(target, { timeout: 10000, maxRedirects: 0, headers: internal ? { Host: url.host } : {}, validateStatus: status => status >= 200 && status < 400 });
        if (response.headers['x-clouddeck-deployment'] !== String(deploymentId)) throw new Error('Public ingress did not confirm this deployment identity');
    }

    async assertActive(deploymentId) {
        const response = await this.client.get(`/api/deployments/${deploymentId}/worker-state`, { timeout: 5000 });
        if (response.status !== 200) throw new Error('Could not verify deployment authorization');
        if (!['pending', 'building', 'deploying'].includes(response.data.status)) throw new Error('Deployment is no longer active');
    }

    // ── Generic exec with live log streaming ──────────────────────────────────
    async exec(deploymentId, cmd, args, opts = {}) {
        if (deploymentId) await this.assertActive(deploymentId);
        return new Promise((resolve, reject) => {
            const proc = spawn(cmd, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                ...opts
            });

            let stderr = '';
            let cancellation = null;
            let checking = false;
            const guard = deploymentId ? setInterval(async () => {
                if (checking) return;
                checking = true;
                try { await this.assertActive(deploymentId); } catch (error) { cancellation = error; proc.kill('SIGTERM'); } finally { checking = false; }
            }, 3000) : null;
            const timeout = setTimeout(() => { cancellation = new Error('Build command timed out'); proc.kill('SIGKILL'); }, 600000);
            const finish = () => { if (guard) clearInterval(guard); clearTimeout(timeout); };

            proc.stdout.on('data', d => {
                const msg = d.toString().trim();
                if (msg && deploymentId) this.log(deploymentId, msg, 'info');
            });

            proc.stderr.on('data', d => {
                const msg = d.toString().trim();
                stderr = (stderr + msg + '\n').slice(-16384);
                if (msg && deploymentId) this.log(deploymentId, msg, 'warn');
            });

            proc.on('close', code => {
                finish();
                if (cancellation) reject(cancellation);
                else if (code === 0) resolve();
                else reject(new Error(`${cmd} ${args[0]} exited ${code}: ${stderr.slice(-300)}`));
            });

            proc.on('error', error => { finish(); reject(error); });
        });
    }

    async cleanup(dir) {
        try { await fs.rm(dir, { recursive: true, force: true }); } catch (_) {}
    }

    // Called by agent on graceful shutdown
    async stopAll() {
        for (const [name] of this.runningContainers) {
            try { await this.exec(null, 'docker', ['stop', name]); } catch (_) {}
        }
        this.runningContainers.clear();
    }
}

module.exports = JobExecutor;
