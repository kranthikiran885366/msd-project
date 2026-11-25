const PortMapping = require('../models/PortMapping');

class PortManagementService {
    constructor(mappings = PortMapping) {
        this.mappings = mappings;
        // FIX: read from env vars, not hardcoded
        this.portRangeStart = parseInt(process.env.PORT_RANGE_START || '4000', 10);
        this.portRangeEnd   = parseInt(process.env.PORT_RANGE_END   || '5000', 10);
        this.usedPorts = new Set();
    }

    /**
     * Initialize port management - load existing mappings
     */
    async initialize() {
        try {
            const mappings = await PortMapping.find({ status: 'active' });
            mappings.forEach(mapping => {
                this.usedPorts.add(mapping.containerPort);
            });
            console.log(`[v0] Port management initialized with ${this.usedPorts.size} active mappings`);
        } catch (error) {
            console.error('[v0] Error initializing port management:', error);
        }
    }

    /**
     * Allocate a port for a new deployment
     */
    async allocatePort(deploymentId, options = {}) {
        const existing = await this.mappings.findOne({ deploymentId, status: 'active' });
        if (existing) {
            if (existing.nodeId !== options.nodeId) throw new Error('Deployment is reserved on another worker');
            return existing;
        }
        if (!options.nodeId) throw new Error('A claimed worker node is required');
        const candidates = [];
        const preferred = Number(options.preferredPort);
        if (Number.isInteger(preferred) && preferred >= this.portRangeStart && preferred <= this.portRangeEnd) candidates.push(preferred);
        for (let port = this.portRangeStart; port <= this.portRangeEnd; port++) if (port !== preferred) candidates.push(port);
        for (const port of candidates) {
            if ([3000, 3001, 4000, 8080].includes(port)) continue;
            const data = { deploymentId, containerPort: port, nodeId: options.nodeId, status: 'active', allocatedAt: new Date(), releasedAt: null };
            try {
                // Existing released records from older versions may still own a unique port.
                const reused = await this.mappings.findOneAndUpdate({ containerPort: port, status: { $in: ['released', 'failed'] } }, { $set: data, $unset: { subdomain: 1 } }, { new: true, runValidators: true });
                return reused || await this.mappings.create(data);
            } catch (error) {
                if (error.code !== 11000) throw error;
                const raced = await this.mappings.findOne({ deploymentId, status: 'active' });
                if (raced) {
                    if (raced.nodeId !== options.nodeId) throw new Error('Deployment is reserved on another worker');
                    return raced;
                }
            }
        }
        throw Object.assign(new Error('No available ports in range'), { status: 503 });
    }

    /**
     * Get mapping for a deployment
     */
    async getPortMapping(deploymentId) {
        try {
            return await PortMapping.findOne({ deploymentId, status: 'active' });
        } catch (error) {
            console.error('[v0] Error getting port mapping:', error);
            return null;
        }
    }

    /**
     * Release a port from a deployment
     */
    async releasePort(deploymentId) {
        // Live reservations are not historical audit records. Removing one releases
        // the unique index only after the worker confirms its runtime is gone.
        return this.mappings.findOneAndDelete({ deploymentId });
    }

    /**
     * Get all active port mappings
     */
    async getAllActiveMappings() {
        try {
            return await PortMapping.find({ status: 'active' }).sort({ allocatedAt: -1 });
        } catch (error) {
            console.error('[v0] Error getting active mappings:', error);
            return [];
        }
    }

    /**
     * Get port utilization statistics
     */
    async getPortStats() {
        try {
            const totalPorts = this.portRangeEnd - this.portRangeStart + 1;
            const activeMappings = await PortMapping.countDocuments({ status: 'active' });

            return {
                portRangeStart: this.portRangeStart,
                portRangeEnd: this.portRangeEnd,
                totalAvailable: totalPorts,
                activeAllocations: activeMappings,
                availablePorts: totalPorts - activeMappings,
                utilizationPercent: (activeMappings / totalPorts) * 100
            };
        } catch (error) {
            console.error('[v0] Error getting port stats:', error);
            return null;
        }
    }

    /**
     * Build nginx routing configuration
     */
    async generateNginxConfig(nodeIp, mappings) {
        try {
            let config = `# Auto-generated Nginx configuration for port routing
# Generated: ${new Date().toISOString()}

`;

            for (const mapping of mappings) {
                const backendName = `backend_${mapping.deploymentId.toString().slice(-8)}`;
                
                config += `upstream ${backendName} {
    server localhost:${mapping.containerPort} max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name ${mapping.subdomain || `app-${mapping.deploymentId.toString().slice(-8)}.yourdomain.com`};

    client_max_body_size 100m;

    location / {
        proxy_pass http://${backendName};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        try_files $uri =204;
    }
}

`;
            }

            return config;
        } catch (error) {
            console.error('[v0] Error generating nginx config:', error);
            return null;
        }
    }

    /**
     * Cleanup old port mappings
     */
    async cleanupOldMappings(daysOld = 7) {
        try {
            const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
            
            const result = await PortMapping.deleteMany({
                status: 'released',
                releasedAt: { $lt: cutoff }
            });

            console.log(`[v0] Cleaned up ${result.deletedCount} old port mappings`);
            return result;
        } catch (error) {
            console.error('[v0] Error cleaning up port mappings:', error);
            throw error;
        }
    }

    /**
     * Check if a specific port is available
     */
    isPortAvailable(port) {
        return !this.usedPorts.has(port) && 
               port >= this.portRangeStart && 
               port <= this.portRangeEnd;
    }

    /**
     * Get next available port
     */
    getNextAvailablePort() {
        for (let port = this.portRangeStart; port <= this.portRangeEnd; port++) {
            if (this.isPortAvailable(port)) {
                return port;
            }
        }
        return null;
    }
}

module.exports = new PortManagementService();
module.exports.PortManagementService = PortManagementService;
