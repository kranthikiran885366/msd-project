'use strict';
const express = require('express');
const router  = express.Router();
const nodeManagementService = require('../services/nodeManagementService');
const { validateRequest } = require('../middleware/validation');
const internalAuth = require('../middleware/internalAuth');

/**
 * POST /api/nodes/register
 * Register a worker node. Called by runner-agent on startup.
 * Required: nodeId, hostname, privateIp, publicIp
 */
router.post('/register', validateRequest(['nodeId', 'hostname']), async (req, res) => {
    try {
        const { nodeId, hostname, privateIp, publicIp, region, availabilityZone, totalCapacity } = req.body;

        const node = await nodeManagementService.registerNode({
            nodeId,
            hostname,
            privateIp: privateIp || '',
            publicIp:  publicIp  || '',
            region,
            availabilityZone,
            totalCapacity
        });

        res.json({ success: true, message: 'Node registered', node });
    } catch (error) {
        console.error('[nodes] Register error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/nodes/heartbeat
 * Worker sends metrics every ~10 s.
 */
router.post('/heartbeat', validateRequest(['nodeId']), async (req, res) => {
    try {
        const { nodeId, metrics } = req.body;
        const node = await nodeManagementService.updateNodeHeartbeat(nodeId, metrics || {});
        res.json({ success: true, message: 'Heartbeat received', node });
    } catch (error) {
        console.error('[nodes] Heartbeat error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/nodes
 */
router.get('/', async (req, res) => {
    try {
        const nodes = await nodeManagementService.getAllNodes(req.query.status || null);
        res.json({ success: true, nodes, count: nodes.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/nodes/available
 */
router.get('/available', async (req, res) => {
    try {
        const nodes = await nodeManagementService.getAvailableNodes(req.query.region || null);
        res.json({ success: true, nodes, count: nodes.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/nodes/stats/overview
 */
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = await nodeManagementService.getNodeStats();
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/nodes/:nodeId
 */
router.get('/:nodeId', async (req, res) => {
    try {
        const node = await nodeManagementService.getNode(req.params.nodeId);
        if (!node) return res.status(404).json({ success: false, error: 'Node not found' });

        const capacity = await nodeManagementService.getNodeCapacity(req.params.nodeId);
        res.json({ success: true, node, capacity });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/nodes/:nodeId
 */
router.delete('/:nodeId', async (req, res) => {
    try {
        const result = await nodeManagementService.deleteNode(req.params.nodeId);
        res.json({ success: true, message: 'Node deleted', result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/nodes/:nodeId/error
 * Worker reports an error.
 */
router.post('/:nodeId/error', async (req, res) => {
    try {
        await nodeManagementService.recordNodeError(req.params.nodeId, req.body.error || 'Unknown error');
        res.json({ success: true, message: 'Error recorded' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
