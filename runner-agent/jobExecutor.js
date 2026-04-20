const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class JobExecutor {
    constructor(nodeId, backendUrl) {
        this.nodeId     = nodeId;
        this.backendUrl = backendUrl;
        this.client     = axios.create({
            baseURL: backendUrl,
            timeout: 600000,
            headers: process.env.WORKER_SECRET
                ? { Authorization: `Bearer ${process.env.WORKER_SECRET}` }
                : {}
        });
        this.runningContainers = new Map();
    }

    async executeJob(job) {
        const deploymentId = job.deploymentId || job.id;
        console.log(`[executor] Starting job: ${deploymentId}`);

        let workspaceDir = null;
        let imageTag = null;
        let port = null;

        try {
            await this.updateStatus(deploymentId, 'building');

            // 1. Clone repository
            workspaceDir = await this.cloneRepository(job, deploymentId);
            console.log(`[executor] Cloned to ${workspaceDir}`);

            // 2. Generate Dockerfile (use existing one if present, else auto-detect)
            await this.updateStatus(deploymentId, 'dockerfile_generation');
            await this.ensureDockerfile(workspaceDir, job);

            // 3. Build Docker image
            await this.updateStatus(deploymentId, 'docker_building');
            imageTag = `msd-${deploymentId.toString().slice(-12)}:latest`;
            await this.buildImage(deploymentId, workspaceDir, imageTag);
            console.log(`[executor] Image built: ${imageTag}`);

            // 4. Allocate port
            port = await this.allocatePort(deploymentId);
            console.log(`[executor] Allocated port ${port}`);

            // 5. Run container in detached mode (stays running)
            await this.updateStatus(deploymentId, 'docker_running');
            const containerName = `msd-${deploymentId.toString().slice(-12)}`;
            await this.runDetachedContainer(deploymentId, imageTag, containerName, port);

            // 6. Wait briefly then verify container is up
            await new Promise(r => setTimeout(r, 3000));
            const isUp = await this.isContainerRunning(containerName);
            if (!isUp) throw new Error('Container exited immediately after start');

            // Use PUBLIC IP for the live app URL (accessible by end users)
            const appUrl = `http://${process.env.NODE_PUBLIC_IP || process.env.NODE_IP || 'localhost'}:${port}`;

            await this.updateStatus(deploymentId, 'running', {
                url: appUrl,
                imageTag,
                port,
                nodeId: this.nodeId,
                completedAt: new Date()
            });

            await this.log(deploymentId, `Deployment live at ${appUrl}`, 'info');
            await this.cleanup(workspaceDir);

            return { deploymentId, status: 'running', url: appUrl, imageTag };

        } catch (error) {
            console.error(`[executor] Job ${deploymentId} failed: ${error.message}`);
            await this.log(deploymentId, `Build failed: ${error.message}`, 'error');
            await this.updateStatus(deploymentId, 'failed', { error: error.message, completedAt: new Date() });

            // Release port on failure
            if (port) {
                try { await this.client.post(`/api/ports/${deploymentId}/release`); } catch (_) {}
            }
            if (workspaceDir) await this.cleanup(workspaceDir);
            throw error;
        }
    }

    async cloneRepository(job, deploymentId) {
        const branch = job.data?.branch || job.branch || 'main';
        const repoUrl = job.data?.repositoryUrl || job.data?.gitUrl || job.repositoryUrl || job.gitUrl;
        const accessToken = job.data?.accessToken || process.env.GITHUB_TOKEN;

        if (!repoUrl) throw new Error('Repository URL not provided in job data');

        let cloneUrl = repoUrl;
        if (accessToken && repoUrl.includes('github.com')) {
            cloneUrl = repoUrl.replace('https://github.com/', `https://${accessToken}@github.com/`);
        }

        const workspaceDir = path.join('/tmp', 'msd-builds', deploymentId.toString());
        await fs.rm(workspaceDir, { recursive: true, force: true });
        await fs.mkdir(workspaceDir, { recursive: true });

        await this.log(deploymentId, `Cloning ${repoUrl} (branch: ${branch})`, 'info');

        await this.exec(deploymentId, 'git', [
            'clone', '--depth', '1', '--branch', branch, cloneUrl, workspaceDir
        ]);

        return workspaceDir;
    }

    async ensureDockerfile(workspaceDir, job) {
        const dockerfilePath = path.join(workspaceDir, 'Dockerfile');

        // If repo already has a Dockerfile, use it
        try {
            await fs.access(dockerfilePath);
            console.log('[executor] Using existing Dockerfile from repo');
            return;
        } catch (_) {}

        // Auto-generate based on project type
        const projectType = await this.detectProjectType(workspaceDir);
        console.log(`[executor] Auto-generating Dockerfile for: ${projectType}`);

        const dockerfile = this.generateDockerfile(projectType);
        await fs.writeFile(dockerfilePath, dockerfile);

        // Generate nginx.conf for SPA projects
        if (['react', 'vue', 'static'].includes(projectType)) {
            const nginxConf = `server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ { expires 1y; }
}`;
            await fs.writeFile(path.join(workspaceDir, 'nginx.conf'), nginxConf);
        }
    }

    async detectProjectType(workspaceDir) {
        try {
            const pkg = JSON.parse(await fs.readFile(path.join(workspaceDir, 'package.json'), 'utf8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps.next) return 'nextjs';
            if (deps.react) return 'react';
            if (deps.vue) return 'vue';
            return 'node';
        } catch (_) {}
        try { await fs.access(path.join(workspaceDir, 'requirements.txt')); return 'python'; } catch (_) {}
        try { await fs.access(path.join(workspaceDir, 'index.html')); return 'static'; } catch (_) {}
        return 'node';
    }

    generateDockerfile(projectType) {
        const templates = {
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
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "require('http').get('http://localhost:3000/api/health',(r)=>{process.exit(r.statusCode===200?0:1)})"
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
        return templates[projectType] || templates.node;
    }

    async buildImage(deploymentId, workspaceDir, imageTag) {
        await this.log(deploymentId, `Building Docker image: ${imageTag}`, 'info');
        await this.exec(deploymentId, 'docker', [
            'build', '-t', imageTag,
            '--memory=512m', '--memory-swap=512m',
            '--label', `deployment=${deploymentId}`,
            '.'
        ], { cwd: workspaceDir });
    }

    // FIX: use --detach so container keeps running after this call returns
    async runDetachedContainer(deploymentId, imageTag, containerName, port) {
        // Detect internal port from project type stored in imageTag label
        // react/vue/static use nginx (port 80), everything else uses 3000
        const nginxTypes = ['react', 'vue', 'static'];
        const projectType = imageTag.split(':')[0].replace('msd-', '');
        const internalPort = nginxTypes.some(t => imageTag.includes(t)) ? 80 : 3000;

        await this.log(deploymentId, `Starting container ${containerName} on port ${port}`, 'info');

        await this.exec(deploymentId, 'docker', [
            'run',
            '--detach',                          // FIX: was --rm which killed container immediately
            '--name', containerName,
            '--memory=256m',
            '--cpus=0.5',
            '--restart=unless-stopped',          // auto-restart on crash
            '-p', `${port}:${internalPort}`,
            '-e', 'NODE_ENV=production',
            '--label', `deployment=${deploymentId}`,
            '--label', `managed-by=clouddeck`,
            imageTag
        ]);

        this.runningContainers.set(containerName, { deploymentId, port, imageTag });
    }

    async isContainerRunning(containerName) {
        return new Promise((resolve) => {
            const proc = spawn('docker', ['inspect', '--format', '{{.State.Running}}', containerName]);
            let out = '';
            proc.stdout.on('data', d => out += d.toString());
            proc.on('close', () => resolve(out.trim() === 'true'));
            proc.on('error', () => resolve(false));
        });
    }

    async allocatePort(deploymentId) {
        try {
            const response = await this.client.post('/api/ports/allocate', {
                deploymentId,
                nodeId: this.nodeId
            });
            return response.data?.port;
        } catch (error) {
            console.error('[executor] Port allocation failed:', error.message);
            // FIX: fallback to random port in safe range, not 3001 (backend port)
            const start = parseInt(process.env.PORT_RANGE_START || '4000', 10);
            const end   = parseInt(process.env.PORT_RANGE_END   || '5000', 10);
            return start + Math.floor(Math.random() * (end - start));
        }
    }

    // FIX: was POSTing to wrong route — backend uses PATCH /:id/status
    async updateStatus(deploymentId, status, updates = {}) {
        try {
            await this.client.patch(`/api/deployments/${deploymentId}/status`, {
                status,
                ...updates
            });
        } catch (_) {
            // Also try the worker-specific POST route
            try {
                await this.client.post(`/api/deployments/${deploymentId}/status`, { status, ...updates });
            } catch (err) {
                console.warn(`[executor] Status update failed: ${err.message}`);
            }
        }
    }

    // FIX: was POSTing to non-existent route — now uses the worker log route added to deployments.js
    async log(deploymentId, message, level = 'info') {
        try {
            await this.client.post(`/api/deployments/${deploymentId}/logs`, {
                message: message.trim(),
                level,
                timestamp: new Date()
            });
        } catch (_) {
            // Non-fatal — log locally
            console.log(`[executor][${level}] ${deploymentId}: ${message}`);
        }
    }

    async exec(deploymentId, cmd, args, options = {}) {
        return new Promise((resolve, reject) => {
            const proc = spawn(cmd, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                ...options
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                if (deploymentId) this.log(deploymentId, data.toString().trim(), 'info');
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                if (deploymentId) this.log(deploymentId, data.toString().trim(), 'warn');
            });

            proc.on('close', (code) => {
                if (code === 0) resolve({ stdout, stderr, code });
                else reject(new Error(`${cmd} ${args[0]} failed (exit ${code}): ${stderr.slice(-500)}`));
            });

            proc.on('error', reject);
        });
    }

    async cleanup(workspaceDir) {
        try {
            await fs.rm(workspaceDir, { recursive: true, force: true });
        } catch (_) {}
    }

    // Called on agent shutdown — stop all containers this executor started
    async stopAllContainers() {
        for (const [name] of this.runningContainers) {
            try {
                await this.exec(null, 'docker', ['stop', name]);
                console.log(`[executor] Stopped container: ${name}`);
            } catch (_) {}
        }
        this.runningContainers.clear();
    }
}

module.exports = JobExecutor;
