'use strict';
const WorkerNode = require('../models/WorkerNode');

// How long without a heartbeat before a node is considered inactive (ms)
const HEARTBEAT_TIMEOUT_MS = 45000; // 45 s — workers send every 10 s
// Max containers per node before it is excluded from scheduling
const MAX_CONTAINERS_PER_NODE = 10;

class NodeManagementService {
    constructor() {
        this.healthCheckInterval = null;
    }

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Register or re-register a worker node.
     * Payload must include: nodeId, hostname, privateIp, publicIp, region, totalCapacity
     */
    async registerNode(nodeData) {
        const {
            nodeId,
            hostname,
            privateIp = '',
            publicIp  = '',
            region    = 'us-east-1',
            availabilityZone = '',
            totalCapacity = { cpu: 2, memory: 2048, storage: 10240 }
        } = nodeData;

        let node = await WorkerNode.findOne({ nodeId });

        if (node) {
            node.status           = 'active';
            node.lastHeartbeat    = new Date();
            node.hostname         = hostname;
            node.privateIp        = privateIp;
            node.publicIp         = publicIp;
            node.region           = region;
            node.availabilityZone = availabilityZone;
            node.totalCapacity    = totalCapacity;
            await node.save();
        } else {
            node = await WorkerNode.create({
                nodeId,
                hostname,
                privateIp,
                publicIp,
                region,
                availabilityZone,
                status: 'active',
                lastHeartbeat: new Date(),
                cpuUsage: 0,
                memoryUsage: 0,
                diskUsage: 0,
                activeContainers: 0,
                totalCapacity,
                registeredAt: new Date()
            });
        }

        console.log(`[nodes] Registered: ${nodeId} private=${privateIp} public=${publicIp} region=${region}`);
        return node;
    }

    // ── Heartbeat ─────────────────────────────────────────────────────────────

    async updateNodeHeartbeat(nodeId, metrics = {}) {
        const node = await WorkerNode.findOne({ nodeId });
        if (!node) throw new Error(`Node ${nodeId} not found`);

        node.lastHeartbeat    = new Date();
        node.cpuUsage         = metrics.cpuUsage         ?? node.cpuUsage;
        node.memoryUsage      = metrics.memoryUsage      ?? node.memoryUsage;
        node.diskUsage        = metrics.diskUsage        ?? node.diskUsage;
        node.activeContainers = metrics.activeContainers ?? node.activeContainers;

        // Recover from inactive/failed if heartbeat arrives
        if (node.status !== 'active') node.status = 'active';

        await node.save();
        return node;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    async getNode(nodeId) {
        const node = await WorkerNode.findOne({ nodeId });
        if (!node) return null;
        await this._checkHeartbeat(node);
        return node;
    }

    async getAllNodes(status = null) {
        const query = status ? { status } : {};
        const nodes = await WorkerNode.find(query).sort({ createdAt: -1 });
        await Promise.all(nodes.map(n => this._checkHeartbeat(n)));
        return nodes;
    }

    async getAvailableNodes(preferredRegion = null) {
        const nodes = await this.getAllNodes('active');
        const available = nodes.filter(n => n.activeContainers < MAX_CONTAINERS_PER_NODE);

        // Prefer same-region nodes first (AWS AZ-aware scheduling)
        if (preferredRegion) {
            const sameRegion = available.filter(n => n.region === preferredRegion);
            if (sameRegion.length > 0) return sameRegion;
        }
        return available;
    }

    // ── URL helpers ───────────────────────────────────────────────────────────

    /**
     * Returns the URL a user's browser can reach for a deployed container.
     * Uses publicIp (AWS EC2 public IP) + the allocated port.
     */
    getAppUrl(node, port) {
        const host = node.publicIp || node.privateIp || 'localhost';
        return `http://${host}:${port}`;
    }

    /**
     * Returns the URL the backend uses to communicate with the worker.
     * Uses privateIp (AWS VPC internal) for all internal traffic.
     */
    getWorkerUrl(node) {
        const host = node.privateIp || node.publicIp || 'localhost';
        return `http://${host}`;
    }

    // ── Capacity tracking ─────────────────────────────────────────────────────

    async incrementActiveContainers(nodeId) {
        const node = await WorkerNode.findOneAndUpdate(
            { nodeId },
            { $inc: { activeContainers: 1 } },
            { new: true }
        );
        if (!node) throw new Error(`Node ${nodeId} not found`);
        return node;
    }

    async decrementActiveContainers(nodeId) {
        const node = await WorkerNode.findOneAndUpdate(
            { nodeId },
            { $inc: { activeContainers: -1 } },
            { new: true }
        );
        if (!node) throw new Error(`Node ${nodeId} not found`);
        // Guard against going negative
        if (node.activeContainers < 0) {
            await WorkerNode.findOneAndUpdate({ nodeId }, { $set: { activeContainers: 0 } });
        }
        return node;
    }

    async getNodeCapacity(nodeId) {
        const node = await this.getNode(nodeId);
        if (!node) return null;

        const cpu    = node.totalCapacity?.cpu    || 2;
        const memory = node.totalCapacity?.memory || 2048;
        const storage= node.totalCapacity?.storage|| 10240;

        return {
            nodeId,
            status: node.status,
            privateIp: node.privateIp,
            publicIp:  node.publicIp,
            cpu:     { total: cpu,     percentUsed: node.cpuUsage },
            memory:  { total: memory,  percentUsed: node.memoryUsage },
            storage: { total: storage, percentUsed: node.diskUsage },
            activeContainers: node.activeContainers,
            containerCapacity: MAX_CONTAINERS_PER_NODE
        };
    }

    // ── Error tracking ────────────────────────────────────────────────────────

    async recordNodeError(nodeId, errorMessage) {
        const node = await WorkerNode.findOne({ nodeId });
        if (!node) return;

        node.errors = node.errors || [];
        node.errors.push({ timestamp: new Date(), message: errorMessage });
        if (node.errors.length > 20) node.errors = node.errors.slice(-20);

        // 5+ errors in 5 minutes → mark failed
        const fiveMinAgo = Date.now() - 300000;
        const recentErrors = node.errors.filter(e => e.timestamp.getTime() > fiveMinAgo);
        if (recentErrors.length >= 5) {
            node.status = 'failed';
            console.error(`[nodes] Node ${nodeId} marked FAILED (${recentErrors.length} recent errors)`);
        }

        await node.save();
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    async getNodeStats() {
        const nodes = await this.getAllNodes();
        const stats = {
            totalNodes:      nodes.length,
            activeNodes:     nodes.filter(n => n.status === 'active').length,
            inactiveNodes:   nodes.filter(n => n.status === 'inactive').length,
            failedNodes:     nodes.filter(n => n.status === 'failed').length,
            totalActiveContainers: 0,
            avgCpuUsage:    0,
            avgMemoryUsage: 0,
            byRegion: {}
        };

        let totalCpu = 0, totalMem = 0;
        for (const n of nodes) {
            stats.totalActiveContainers += n.activeContainers || 0;
            totalCpu += n.cpuUsage    || 0;
            totalMem += n.memoryUsage || 0;
            stats.byRegion[n.region] = (stats.byRegion[n.region] || 0) + 1;
        }
        if (nodes.length > 0) {
            stats.avgCpuUsage    = totalCpu / nodes.length;
            stats.avgMemoryUsage = totalMem / nodes.length;
        }
        return stats;
    }

    // ── Health monitoring ─────────────────────────────────────────────────────

    startHealthCheck(interval = 30000) {
        if (this.healthCheckInterval) return;
        console.log('[nodes] Health check monitor started');
        this.healthCheckInterval = setInterval(async () => {
            try {
                const nodes = await WorkerNode.find({ status: 'active' });
                for (const node of nodes) {
                    await this._checkHeartbeat(node);
                }
            } catch (err) {
                console.error('[nodes] Health check error:', err.message);
            }
        }, interval);
    }

    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    async deleteNode(nodeId) {
        const result = await WorkerNode.deleteOne({ nodeId });
        console.log(`[nodes] Deleted node: ${nodeId}`);
        return result;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    async _checkHeartbeat(node) {
        const age = Date.now() - node.lastHeartbeat.getTime();
        if (age > HEARTBEAT_TIMEOUT_MS && node.status === 'active') {
            node.status = 'inactive';
            await node.save();
            console.warn(`[nodes] Node ${node.nodeId} marked INACTIVE (no heartbeat for ${Math.round(age / 1000)}s)`);
        }
    }
}

module.exports = new NodeManagementService();
