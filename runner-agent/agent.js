'use strict';
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const axios          = require('axios');
const NodeRegistry   = require('./nodeRegistry');
const JobExecutor    = require('./jobExecutor');
const os             = require('os');

class Agent {
    constructor() {
        this.nodeId     = process.env.NODE_ID     || uuidv4();
        this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

        // AWS EC2 addresses resolved by start-worker.sh
        this.privateIp  = process.env.NODE_PRIVATE_IP || process.env.NODE_IP || '';
        this.publicIp   = process.env.NODE_PUBLIC_IP  || '';
        this.region     = process.env.REGION          || 'us-east-1';
        this.az         = process.env.AVAILABILITY_ZONE || '';

        this.nodeRegistry = new NodeRegistry(this.nodeId, this.backendUrl);
        this.jobExecutor  = new JobExecutor(this.nodeId, this.backendUrl);

        this.isRunning          = false;
        this.isRegistered       = false;
        this.heartbeatInterval  = null;
        this.jobPollInterval    = null;
        this.maxConcurrentJobs  = parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10);
        this.activeJobs         = new Map();
    }

    async start() {
        console.log(`[agent] Starting — ID: ${this.nodeId} | private: ${this.privateIp} | public: ${this.publicIp}`);

        await this.nodeRegistry.register({
            hostname:         os.hostname(),
            privateIp:        this.privateIp,
            publicIp:         this.publicIp,
            region:           this.region,
            availabilityZone: this.az,
            totalCapacity: {
                cpu:     os.cpus().length,
                memory:  Math.floor(os.totalmem() / 1024 / 1024),
                storage: 10240
            }
        });

        this.isRegistered = true;
        this.isRunning = true;
        this.startHeartbeat();
        this.startJobPolling();
        this.startMonitoring();
        console.log('[agent] Started successfully');
    }

    startHeartbeat(interval = 10000) {
        this.heartbeatInterval = setInterval(async () => {
            try {
                await this.nodeRegistry.sendHeartbeat(this._getMetrics());
            } catch (err) {
                console.error('[agent] Heartbeat error:', err.message);
            }
        }, interval);
        console.log('[agent] Heartbeat started');
    }

    startJobPolling(interval = 5000) {
        this.jobPollInterval = setInterval(async () => {
            try {
                if (this.activeJobs.size < this.maxConcurrentJobs) {
                    await this._pollJobs();
                }
            } catch (err) {
                console.error('[agent] Job poll error:', err.message);
            }
        }, interval);
        console.log('[agent] Job polling started');
    }

    async _pollJobs() {
        try {
            const response = await axios.get(`${this.backendUrl}/api/jobs/pull`, {
                params:  { nodeId: this.nodeId },
                headers: this.nodeRegistry.authHeaders(),
                timeout: 8000
            });

            const jobs = response.data?.jobs || [];
            for (const job of jobs) {
                if (this.activeJobs.size >= this.maxConcurrentJobs) break;
                this._executeJobAsync(job);
            }
        } catch (err) {
            if (err.response?.status === 404) return; // no jobs — normal
            console.error('[agent] Poll error:', err.message);
        }
    }

    _executeJobAsync(job) {
        const jobId = job.id || job.deploymentId;
        if (this.activeJobs.has(jobId)) return;

        this.activeJobs.set(jobId, { startTime: Date.now(), job });
        console.log(`[agent] Executing job: ${jobId}`);

        this.jobExecutor.executeJob(job)
            .then(() => {
                console.log(`[agent] Job ${jobId} done`);
                this.activeJobs.delete(jobId);
            })
            .catch(err => {
                console.error(`[agent] Job ${jobId} failed:`, err.message);
                this.activeJobs.delete(jobId);
            });
    }

    _getMetrics() {
        const cpus     = os.cpus();
        const totalMem = os.totalmem();
        const freeMem  = os.freemem();
        const cpuUsage = cpus.map(c => {
            const total = Object.values(c.times).reduce((a, b) => a + b, 0);
            return (1 - c.times.idle / total) * 100;
        }).reduce((a, b) => a + b, 0) / cpus.length;

        return {
            cpuUsage:         Math.round(cpuUsage),
            memoryUsage:      Math.round(((totalMem - freeMem) / totalMem) * 100),
            diskUsage:        0,
            activeContainers: this.activeJobs.size,
            timestamp:        new Date()
        };
    }

    startMonitoring() {
        setInterval(() => {
            const now        = Date.now();
            const jobTimeout = 600000;
            for (const [jobId, data] of this.activeJobs) {
                if (now - data.startTime > jobTimeout) {
                    console.warn(`[agent] Job ${jobId} exceeded timeout`);
                }
            }
        }, 60000);
    }

    async shutdown() {
        console.log('[agent] Shutting down...');
        this.isRunning = false;
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.jobPollInterval)   clearInterval(this.jobPollInterval);

        const deadline = Date.now() + 30000;
        while (this.activeJobs.size > 0 && Date.now() < deadline) {
            console.log(`[agent] Waiting for ${this.activeJobs.size} active job(s)...`);
            await new Promise(r => setTimeout(r, 1000));
        }
        if (this.activeJobs.size > 0) {
            console.warn(`[agent] Forcing shutdown with ${this.activeJobs.size} job(s) still running`);
        }
        console.log('[agent] Shutdown complete');
    }
}

module.exports = Agent;
