'use strict';
const express = require('express');
const router  = express.Router();
const deploymentController = require('../controllers/deploymentController');
const gitDeploymentController = require('../controllers/gitDeploymentController');
const authMiddleware   = require('../middleware/auth');
const internalAuth     = require('../middleware/internalAuth');

// ── Git integration ───────────────────────────────────────────────────────────

router.post('/repository/:projectId',  authMiddleware, gitDeploymentController.configureRepository);
router.post('/webhooks/git/:provider/:projectId', gitDeploymentController.handleWebhook);
router.post('/preview/:projectId',     authMiddleware, gitDeploymentController.createPreviewDeploy);
router.post('/schedule/:projectId',    authMiddleware, gitDeploymentController.scheduleDeployment);
router.post('/lock/:projectId',        authMiddleware, gitDeploymentController.toggleDeployLock);

// ── Build cache ───────────────────────────────────────────────────────────────

router.get('/cache/check/:projectId',  authMiddleware, deploymentController.getBuildCacheStatus);
router.post('/cache/update/:projectId',authMiddleware, gitDeploymentController.updateBuildCache);

// ── Standard CRUD ─────────────────────────────────────────────────────────────

router.post('/',                       authMiddleware, deploymentController.createDeployment);
router.get('/',                        authMiddleware, deploymentController.getAllDeployments);
router.get('/project/:projectId',      authMiddleware, deploymentController.getDeployments);
router.get('/analytics/project/:projectId', authMiddleware, deploymentController.getProjectDeploymentAnalytics);
router.get('/:id',                     authMiddleware, deploymentController.getDeploymentById);
router.get('/:id/metrics',             authMiddleware, deploymentController.getDeploymentMetrics);
router.patch('/:id/status',            authMiddleware, deploymentController.updateDeploymentStatus);
router.post('/:id/rollback',           authMiddleware, deploymentController.rollbackDeployment);
router.get('/:id/logs',                authMiddleware, deploymentController.getDeploymentLogs);

// ── Worker callbacks (internal — secured by WORKER_SECRET) ───────────────────

/**
 * POST /api/deployments/:id/logs
 * Worker appends a build/runtime log line.
 */
router.post('/:id/logs', internalAuth, async (req, res) => {
    try {
        const Deployment = require('../models/Deployment');
        const { message, level = 'info', timestamp } = req.body;

        const logEntry = { message: String(message).trim(), level, timestamp: timestamp ? new Date(timestamp) : new Date() };

        await Deployment.findByIdAndUpdate(req.params.id, {
            $push: { logs: logEntry }
        });

        // Broadcast to any frontend clients watching this deployment
        _emitLog(req.params.id, logEntry);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/deployments/:id/status
 * Worker reports status change (building → running / failed).
 * Body: { status, url, imageTag, port, nodeId, error, completedAt }
 */
router.post('/:id/status', internalAuth, async (req, res) => {
    try {
        const Deployment = require('../models/Deployment');
        const PortMapping = require('../models/PortMapping');
        const { status, url, imageTag, port, nodeId, error, completedAt } = req.body;

        const updates = { status };
        if (url)          updates.productionUrl  = url;
        if (error)        updates.rollbackReason = error;
        if (completedAt)  updates.deployTime     = new Date(completedAt).getTime();

        await Deployment.findByIdAndUpdate(req.params.id, updates);

        // Persist nodeId on the port mapping for nginx config generation
        if (status === 'running' && port && nodeId) {
            await PortMapping.findOneAndUpdate(
                { deploymentId: req.params.id },
                { nodeId },
                { new: true }
            ).catch(() => {});
        }

        // Broadcast status change to frontend
        _emitStatus(req.params.id, status, { url, error });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── WebSocket broadcast helpers ───────────────────────────────────────────────
// Lazily resolve the WebSocket manager to avoid circular-require issues.

function _getWsManager() {
    try { return require('../services/websocketManager'); } catch (_) { return null; }
}

function _emitLog(deploymentId, logEntry) {
    const ws = _getWsManager();
    if (ws && typeof ws.emitDeploymentUpdate === 'function') {
        ws.emitDeploymentUpdate(deploymentId, { type: 'log', log: logEntry });
    }
}

function _emitStatus(deploymentId, status, extra = {}) {
    const ws = _getWsManager();
    if (ws && typeof ws.emitDeploymentUpdate === 'function') {
        ws.emitDeploymentUpdate(deploymentId, { type: 'status', status, ...extra });
    }
}

module.exports = router;
