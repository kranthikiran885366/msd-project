/**
 * JobExecutor — runs on each worker VM
 * Handles: clone → detect → build → run → report
 * Like Heroku/Render: detached containers, real logs, live URL
 */
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class JobExecutor {
    constructor(nodeId, backendUrl) {
        this.nodeId = nodeId;
        this.backendUrl = backendUrl;
        this.client = axios.create({
            baseURL: backendUrl,
            timeout: 600000,
            validateStatus: () => true // never throw on HTTP errors
        });
        this.runningContainers = new Map(); // containerName → { deploymentId, port }
    }

    async executeJob(job) {
        const deploymentId = job.deploymentId || job.data?.deploymentId || job.id;
        const repoUrl      = job.data?.repositoryUrl || job.data?.gitUrl || job.repositoryUrl;
        const branch       = job.data?.branch || job.branch || 'main';
        const accessToken  = job.data?.accessToken || process.env.GITHUB_TOKEN;

        console.log(`[executor] ▶ Job ${deploymentId} | repo: ${repoUrl} | branch: ${branch}`);

        let workspaceDir = null;
        let imageTag     = null;
        let port         = null;
        const containerName = `msd-${String(deploymentId).slice(-12)}`;

        try {
            // ── Step 1: Clone ──────────────────────────────────────────────
            await this.updateStatus(deploymentId, 'building');
            await this.log(deploymentId, `==> Cloning ${repoUrl}@${branch}`, 'info');

            workspaceDir = await this.cloneRepo(deploymentId, repoUrl, branch, accessToken);

            // ── Step 2: Dockerfile ─────────────────────────────────────────
            await this.log(deploymentId, '==> Detecting project type', 'info');
            await this.ensureDockerfile(deploymentId, workspaceDir);

            // ── Step 3: Build image ────────────────────────────────────────
            await this.log(deploymentId, '==> Building Docker image', 'info');
            imageTag = `msd-${String(deploymentId).slice(-12)}:latest`;
            await this.buildImage(deploymentId, workspaceDir, imageTag);

            // ── Step 4: Allocate port ──────────────────────────────────────
            port = await this.allocatePort(deploymentId);
            await this.log(deploymentId, `==> Allocated port ${port}`, 'info');

            // ── Step 5: Run container (detached, persistent) ───────────────
            await this.updateStatus(deploymentId, 'deploying');
            await this.log(deploymentId, `==> Starting container on port ${port}`, 'info');
            await this.runContainer(deploymentId, imageTag, containerName, port);

            // ── Step 6: Health check ───────────────────────────────────────
            await new Promise(r => setTimeout(r, 3000));
            const alive = await this.isRunning(containerName);
            if (!alive) throw new Error('Container exited immediately — check build logs');

            const nodeIp = process.env.NODE_IP || 'localhost';
            const appUrl = `http://${nodeIp}:${port}`;

            await this.log(deploymentId, `==> ✓ Deployed at ${appUrl}`, 'info');
            await this.updateStatus(deploymentId, 'running', { url: appUrl, imageTag });

            this.runningContainers.set(containerName, { deploymentId, port });
            await this.cleanup(workspaceDir);

            return { deploymentId, status: 'running', url: appUrl };

        } catch (err) {
            console.error(`[executor] ✗ Job ${deploymentId} failed: ${err.message}`);
            await this.log(deploymentId, `==> ✗ ${err.message}`, 'error');
            await this.updateStatus(deploymentId, 'failed', { error: err.message });

            if (port) {
                await this.client.post(`/api/ports/${deploymentId}/release`).catch(() => {});
            }
            if (workspaceDir) await this.cleanup(workspaceDir);
            throw err;
        }
    }

    // ── Clone ──────────────────────────────────────────────────────────────────
    async cloneRepo(deploymentId, repoUrl, branch, accessToken) {
        if (!repoUrl) throw new Error('No repository URL in job data');

        let cloneUrl = repoUrl;
        if (accessToken && repoUrl.includes('github.com')) {
            cloneUrl = repoUrl.replace('https://github.com/', `https://${accessToken}@github.com/`);
        }

        const dir = path.join('/tmp', 'msd-builds', String(deploymentId));
        await fs.rm(dir, { recursive: true, force: true });
        await fs.mkdir(dir, { recursive: true });

        await this.exec(deploymentId, 'git', [
            'clone', '--depth', '1', '--branch', branch, cloneUrl, dir
        ]);
        return dir;
    }

    // ── Dockerfile detection & generation ─────────────────────────────────────
    async ensureDockerfile(deploymentId, dir) {
        // Use repo's own Dockerfile if present
        try {
            await fs.access(path.join(dir, 'Dockerfile'));
            await this.log(deploymentId, '==> Using existing Dockerfile', 'info');
            return;
        } catch (_) {}

        const type = await this.detectType(dir);
        await this.log(deploymentId, `==> Auto-generating Dockerfile (${type})`, 'info');

        const dockerfile = this.makeDockerfile(type);
        await fs.writeFile(path.join(dir, 'Dockerfile'), dockerfile);

        // nginx.conf for SPA types
        if (['react', 'vue', 'static'].includes(type)) {
            await fs.writeFile(path.join(dir, 'nginx.conf'),
                `server{listen 80;server_name _;root /usr/share/nginx/html;index index.html;` +
                `location/{try_files $uri $uri/ /index.html;}}`
            );
        }
    }

    async detectType(dir) {
        try {
            const pkg = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps.next)  return 'nextjs';
            if (deps.react) return 'react';
            if (deps.vue)   return 'vue';
            return 'node';
        } catch (_) {}
        try { await fs.access(path.join(dir, 'requirements.txt')); return 'python'; } catch (_) {}
        try { await fs.access(path.join(dir, 'index.html'));       return 'static'; } catch (_) {}
        return 'node';
    }

    makeDockerfile(type) {
        const t = {
            nextjs: `FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm","start"]`,

            react: `FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]`,

            vue: `FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]`,

            node: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node","index.js"]`,

            python: `FROM python:3.11-slim
WORKDIR /app
COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python","app.py"]`,

            static: `FROM nginx:alpine
COPY . /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]`
        };
        return t[type] || t.node;
    }

    // ── Docker build ───────────────────────────────────────────────────────────
    async buildImage(deploymentId, dir, imageTag) {
        await this.exec(deploymentId, 'docker', [
            'build', '-t', imageTag,
            '--memory=512m', '--memory-swap=512m',
            '--label', `deployment=${deploymentId}`,
            '--label', 'managed-by=clouddeck',
            '.'
        ], { cwd: dir });
    }

    // ── Run container — DETACHED so it stays alive ─────────────────────────────
    async runContainer(deploymentId, imageTag, containerName, port) {
        // Detect internal port: nginx images use 80, node/python use 3000/5000
        const internalPort = imageTag.includes('nginx') ? 80 : 3000;

        await this.exec(deploymentId, 'docker', [
            'run',
            '--detach',                        // FIX: was --rm which killed container on exit
            '--name', containerName,
            '--memory=256m',
            '--cpus=0.5',
            '--restart=unless-stopped',        // auto-restart on crash like Render
            '-p', `${port}:${internalPort}`,
            '-e', 'NODE_ENV=production',
            '--label', `deployment=${deploymentId}`,
            '--label', 'managed-by=clouddeck',
            imageTag
        ]);
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
        try {
            const res = await this.client.post('/api/ports/allocate', {
                deploymentId,
                nodeId: this.nodeId
            });
            if (res.data?.port) return res.data.port;
        } catch (_) {}

        // FIX: safe fallback — never use 3001 (backend port)
        const start = parseInt(process.env.PORT_RANGE_START || '4000', 10);
        const end   = parseInt(process.env.PORT_RANGE_END   || '5000', 10);
        return start + Math.floor(Math.random() * (end - start));
    }

    // ── Status update — tries PATCH first (correct route), falls back to POST ──
    async updateStatus(deploymentId, status, extras = {}) {
        const body = { status, ...extras };
        // Try PATCH /:id/status (authenticated route)
        let res = await this.client.patch(`/api/deployments/${deploymentId}/status`, body);
        if (res.status >= 400) {
            // Fall back to worker POST route (no auth required)
            await this.client.post(`/api/deployments/${deploymentId}/status`, body);
        }
    }

    // ── Log append ─────────────────────────────────────────────────────────────
    async log(deploymentId, message, level = 'info') {
        const trimmed = String(message).trim();
        if (!trimmed) return;
        console.log(`[executor][${level}] ${trimmed}`);
        await this.client.post(`/api/deployments/${deploymentId}/logs`, {
            message: trimmed,
            level,
            timestamp: new Date()
        }).catch(() => {}); // non-fatal
    }

    // ── Generic exec with live log streaming ──────────────────────────────────
    async exec(deploymentId, cmd, args, opts = {}) {
        return new Promise((resolve, reject) => {
            const proc = spawn(cmd, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                ...opts
            });

            let stderr = '';

            proc.stdout.on('data', d => {
                const msg = d.toString().trim();
                if (msg && deploymentId) this.log(deploymentId, msg, 'info');
            });

            proc.stderr.on('data', d => {
                const msg = d.toString().trim();
                stderr += msg + '\n';
                if (msg && deploymentId) this.log(deploymentId, msg, 'warn');
            });

            proc.on('close', code => {
                if (code === 0) resolve();
                else reject(new Error(`${cmd} ${args[0]} exited ${code}: ${stderr.slice(-300)}`));
            });

            proc.on('error', reject);
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
