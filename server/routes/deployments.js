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

// ── Redeploy / rebuild actions ────────────────────────────────────────────────

/**
 * POST /api/deployments/:id/redeploy
 * Trigger a new deployment from the same project + branch (like Render's "Manual Deploy")
 */
router.post('/:id/redeploy', authMiddleware, async (req, res, next) => {
    try {
        const deploymentService = require('../services/deploymentService');
        const Deployment = require('../models/Deployment');
        const orig = await Deployment.findById(req.params.id).lean();
        if (!orig) return res.status(404).json({ error: 'Deployment not found' });

        const newDep = await deploymentService.createDeployment({
            projectId:     orig.projectId,
            gitBranch:     orig.gitBranch || 'main',
            gitAuthor:     req.body.gitAuthor || orig.gitAuthor || 'manual',
            commitMessage: 'Manual redeploy',
            environment:   orig.environment || 'production',
            triggeredBy:   'manual',
            userId:        req.userId,
        });
        res.status(201).json(newDep);
    } catch (err) { next(err); }
});

/**
 * POST /api/deployments/:id/assign-domain
 * Assign a verified domain to a deployment
 */
router.post('/:id/assign-domain', authMiddleware, async (req, res, next) => {
    try {
        const deploymentService = require('../services/deploymentService');
        const { domainId } = req.body;
        const result = await deploymentService.assignDomain(req.params.id, domainId, req.userId);
        res.json(result);
    } catch (err) { next(err); }
});

/**
 * POST /api/deployments/:id/rebuild
 * Rebuild without cache — sets NO_CACHE=true in job data
 */
router.post('/:id/rebuild', authMiddleware, async (req, res, next) => {
    try {
        const deploymentService = require('../services/deploymentService');
        const Deployment = require('../models/Deployment');
        const orig = await Deployment.findById(req.params.id).lean();
        if (!orig) return res.status(404).json({ error: 'Deployment not found' });

        const newDep = await deploymentService.createDeployment({
            projectId:     orig.projectId,
            gitBranch:     orig.gitBranch || 'main',
            gitAuthor:     req.body.gitAuthor || orig.gitAuthor || 'manual',
            commitMessage: 'Rebuild without cache',
            environment:   orig.environment || 'production',
            triggeredBy:   'rebuild',
            noCache:       true,
            userId:        req.userId,
        });
        res.status(201).json(newDep);
    } catch (err) { next(err); }
});

/**
 * POST /api/deployments/:id/cancel
 * Cancel an in-progress deployment
 */
router.post('/:id/cancel', authMiddleware, async (req, res, next) => {
    try {
        const deploymentService = require('../services/deploymentService');
        await deploymentService.cancelDeployment(req.params.id);
        res.json({ success: true, message: 'Deployment cancelled' });
    } catch (err) { next(err); }
});

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
        const { status, url, rawUrl, imageTag, port, nodeId, domain, environment: reportedEnv, error, completedAt } = req.body;

        const dep = await Deployment.findById(req.params.id);
        if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });

        const updates = { status };

        // Prefer worker-supplied rawUrl for preview/staging, otherwise map url based on environment
        const env = reportedEnv || dep.environment || 'production';
        if (rawUrl) {
            if (env === 'staging') updates.stagingUrl = rawUrl;
            if (env === 'preview' || env === 'staging') updates.previewUrl = rawUrl;
            else updates.productionUrl = rawUrl;
        } else if (url) {
            if (env === 'staging') updates.stagingUrl = url;
            if (env === 'preview' || env === 'staging') updates.previewUrl = url;
            else updates.productionUrl = url;
        }

        // Also record local access URL (internal node URL) when provided
        if (req.body.localUrl) updates.localUrl = req.body.localUrl;

        // Domain information and provider metadata merge
        const existingMeta = dep.providerMetadata || {};
        if (domain) {
            updates.providerMetadata = { ...existingMeta, domain };
            updates.customDomain = domain;
            // Prefer custom domain as primary public URL once assigned
            if (env === 'staging') updates.stagingUrl = `https://${domain}`;
            else updates.productionUrl = `https://${domain}`;
        }

        if (error) updates.rollbackReason = error;
        if (completedAt) updates.deployTime = new Date(completedAt).getTime();

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
