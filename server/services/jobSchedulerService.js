'use strict';
const jobQueueService       = require('./jobQueueService');
const nodeManagementService = require('./nodeManagementService');

class JobSchedulerService {
    constructor() {
        this.scheduling         = false;
        this.schedulingInterval = null;
        this.timeoutInterval    = null;
        this.jobTimeoutMs       = 600000; // 10 minutes
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async startScheduler(pollInterval = 5000) {
        if (this.scheduling) return;
        console.log('[scheduler] Starting job scheduler...');
        this.scheduling = true;

        await this.processJobs();

        this.schedulingInterval = setInterval(async () => {
            try { await this.processJobs(); }
            catch (err) { console.error('[scheduler] processJobs error:', err.message); }
        }, pollInterval);

        // Monitor stuck jobs every 60 s
        this.timeoutInterval = setInterval(async () => {
            try { await this.monitorJobTimeouts(); }
            catch (_) {}
        }, 60000);
    }

    stopScheduler() {
        if (this.schedulingInterval) { clearInterval(this.schedulingInterval); this.schedulingInterval = null; }
        if (this.timeoutInterval)    { clearInterval(this.timeoutInterval);    this.timeoutInterval    = null; }
        this.scheduling = false;
        console.log('[scheduler] Stopped');
    }

    // ── Core scheduling loop ──────────────────────────────────────────────────

    async processJobs() {
        const pendingJobs = await jobQueueService.getPendingJobs();
        if (pendingJobs.length === 0) return;

        console.log(`[scheduler] ${pendingJobs.length} pending job(s)`);

        // Get available nodes; pass preferred region from first job if present
        const firstJobRegion = pendingJobs[0]?.data?.region || null;
        const availableNodes = await nodeManagementService.getAvailableNodes(firstJobRegion);

        if (availableNodes.length === 0) {
            console.log('[scheduler] No available worker nodes — jobs waiting');
            return;
        }

        for (const job of pendingJobs) {
            if (!job) continue;

            // Skip jobs already assigned to a node
            if (job.data?.assignedNodeId) continue;

            const jobRegion = job.data?.region || null;
            const node = await this._selectBestNode(availableNodes, jobRegion);
            if (!node) {
                console.log('[scheduler] All nodes at capacity');
                break;
            }

            try {
                await this._assignJobToNode(job, node);
                // Optimistically reduce capacity so next iteration picks a different node
                node.activeContainers += 1;
            } catch (err) {
                console.error(`[scheduler] Failed to assign job ${job.id}:`, err.message);
            }
        }
    }

    // ── Node selection — region-aware, load-balanced ──────────────────────────

    async _selectBestNode(availableNodes, preferredRegion = null) {
        let candidates = availableNodes.filter(n => n.activeContainers < 10);
        if (candidates.length === 0) return null;

        // Prefer same-region nodes (AWS AZ locality)
        if (preferredRegion) {
            const regional = candidates.filter(n => n.region === preferredRegion);
            if (regional.length > 0) candidates = regional;
        }

        // Score: lower is better — 30% CPU + 30% memory + 40% container utilisation
        let best = null, bestScore = Infinity;
        for (const n of candidates) {
            const score = (n.cpuUsage * 0.3) + (n.memoryUsage * 0.3) + ((n.activeContainers / 10) * 100 * 0.4);
            if (score < bestScore) { bestScore = score; best = n; }
        }
        return best;
    }

    async _assignJobToNode(job, node) {
        console.log(`[scheduler] Assigning job ${job.id} → node ${node.nodeId} (${node.region})`);

        await job.updateData({
            ...job.data,
            assignedNodeId: node.nodeId,
            assignedAt:     new Date()
        });

        await jobQueueService.updateJobProgress(job.id, {
            status: 'assigned',
            nodeId: node.nodeId,
            timestamp: new Date()
        });

        await nodeManagementService.incrementActiveContainers(node.nodeId);
        console.log(`[scheduler] Job ${job.id} assigned to ${node.nodeId}`);
    }

    // ── Completion / failure hooks ────────────────────────────────────────────

    async onJobCompleted(jobId) {
        const job = await jobQueueService.getJob(jobId);
        if (!job) return;
        const nodeId = job.data?.assignedNodeId;
        if (nodeId) await nodeManagementService.decrementActiveContainers(nodeId).catch(() => {});
        console.log(`[scheduler] Job ${jobId} completed`);
    }

    async onJobFailed(jobId, error) {
        const job = await jobQueueService.getJob(jobId);
        if (!job) return;
        const nodeId = job.data?.assignedNodeId;
        if (nodeId) {
            await nodeManagementService.recordNodeError(nodeId, error?.message || String(error)).catch(() => {});
            await nodeManagementService.decrementActiveContainers(nodeId).catch(() => {});
        }
        console.log(`[scheduler] Job ${jobId} failed: ${error?.message}`);
    }

    // ── Timeout monitoring ────────────────────────────────────────────────────

    async monitorJobTimeouts() {
        const activeJobs = await jobQueueService.getActiveJobs();
        const now = Date.now();
        for (const job of activeJobs) {
            if (!job.processedOn) continue;
            const elapsed = now - job.processedOn;
            if (elapsed > this.jobTimeoutMs) {
                console.warn(`[scheduler] Job ${job.id} timed out (${Math.round(elapsed / 1000)}s)`);
                try {
                    await job.moveToFailed(new Error('Job timeout exceeded'), true);
                    await this.onJobFailed(job.id, new Error('Job timeout'));
                } catch (_) {}
            }
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    async getSchedulerStats() {
        const [queue, nodes] = await Promise.all([
            jobQueueService.getQueueStats(),
            nodeManagementService.getNodeStats()
        ]);
        return { queue, nodes, isRunning: this.scheduling };
    }
}

module.exports = new JobSchedulerService();
