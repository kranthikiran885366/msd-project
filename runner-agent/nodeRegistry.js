'use strict';
const axios = require('axios');

class NodeRegistry {
    constructor(nodeId, backendUrl) {
        this.nodeId     = nodeId;
        this.backendUrl = backendUrl;
        this.client     = axios.create({
            baseURL: backendUrl,
            timeout: 10000,
            headers: this._buildAuthHeaders()
        });
    }

    // Returns Authorization header using WORKER_SECRET
    _buildAuthHeaders() {
        const secret = process.env.WORKER_SECRET || '';
        return secret ? { Authorization: `Bearer ${secret}` } : {};
    }

    // Expose for agent.js polling calls
    authHeaders() {
        return this._buildAuthHeaders();
    }

    async register(nodeData) {
        try {
            const response = await this.client.post('/api/nodes/register', {
                nodeId: this.nodeId,
                ...nodeData
            });
            console.log(`[registry] Registered: ${this.nodeId}`);
            return response.data;
        } catch (error) {
            console.error('[registry] Registration failed:', error.message);
            throw error;
        }
    }

    async sendHeartbeat(metrics) {
        try {
            const response = await this.client.post('/api/nodes/heartbeat', {
                nodeId: this.nodeId,
                metrics
            });
            return response.data;
        } catch (error) {
            // Non-fatal — log and continue
            console.error('[registry] Heartbeat failed:', error.message);
        }
    }

    async getNodeStatus() {
        try {
            const response = await this.client.get(`/api/nodes/${this.nodeId}`);
            return response.data;
        } catch (error) {
            console.error('[registry] getNodeStatus failed:', error.message);
            return null;
        }
    }

    async reportError(errorMessage, context = {}) {
        try {
            await this.client.post(`/api/nodes/${this.nodeId}/error`, {
                error: errorMessage,
                context,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('[registry] reportError failed:', error.message);
        }
    }
}

module.exports = NodeRegistry;
