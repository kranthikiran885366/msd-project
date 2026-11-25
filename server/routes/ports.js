const express = require('express');
const router = express.Router();
const portManagementService = require('../services/portManagementService');
const { validateRequest } = require('../middleware/validation');
const { workerClaim } = require('../middleware/workerClaim');

router.use(require('../middleware/internalAuth'));

/**
 * POST /api/ports/allocate
 * Allocate a port for a deployment
 */
router.post('/allocate', validateRequest(['deploymentId']), workerClaim, async (req, res) => {
    try {
        const { deploymentId, preferredPort, subdomain } = req.body;
        if (!['building', 'deploying'].includes(req.workerDeployment.status)) return res.status(409).json({ error: 'Deployment is not active' });

        const mapping = await portManagementService.allocatePort(deploymentId, {
            nodeId: req.workerDeployment.workerNodeId,
            preferredPort,
            subdomain,
        });

        res.json({
            success: true,
            message: 'Port allocated',
            port: mapping.containerPort,
            mapping
        });
    } catch (error) {
        console.error('[v0] Error allocating port:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ports/:deploymentId
 * Get port mapping for a deployment
 */
router.get('/:deploymentId', async (req, res) => {
    try {
        const { deploymentId } = req.params;
        const mapping = await portManagementService.getPortMapping(deploymentId);

        if (!mapping) {
            return res.status(404).json({
                success: false,
                error: 'Port mapping not found'
            });
        }

        res.json({
            success: true,
            port: mapping.containerPort,
            mapping
        });
    } catch (error) {
        console.error('[v0] Error getting port mapping:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ports/:deploymentId/release
 * Release a port
 */
router.post('/:deploymentId/release', (req, res) => res.status(410).json({ error: 'Use the claimed deployment cleanup acknowledgement after stopping its runtime' }));

/**
 * GET /api/ports
 * Get all active port mappings
 */
router.get('/', async (req, res) => {
    try {
        const mappings = await portManagementService.getAllActiveMappings();

        res.json({
            success: true,
            mappings,
            count: mappings.length
        });
    } catch (error) {
        console.error('[v0] Error getting port mappings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ports/stats
 * Get port utilization statistics
 */
router.get('/stats/utilization', async (req, res) => {
    try {
        const stats = await portManagementService.getPortStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('[v0] Error getting port stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ports/nginx-config
 * Generate nginx upstream config for all active port mappings
 */
router.get('/nginx-config', async (req, res) => {
    try {
        const mappings = await portManagementService.getAllActiveMappings();
        const nodeIp = process.env.NODE_IP || 'localhost';
        const config = await portManagementService.generateNginxConfig(nodeIp, mappings);
        res.type('text/plain').send(config);
    } catch (error) {
        console.error('[v0] Error generating nginx config:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
