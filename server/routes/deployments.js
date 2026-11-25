'use strict';
const express = require('express');
const router  = express.Router();
const deploymentController = require('../controllers/deploymentController');
const gitDeploymentController = require('../controllers/gitDeploymentController');
const authMiddleware   = require('../middleware/auth');
const internalAuth     = require('../middleware/internalAuth');
const { workerClaim, hashClaim } = require('../middleware/workerClaim');
const { randomBytes } = require('crypto');
const { authorizeDeployment } = require('../middleware/resourceOwnership');

// ── Git integration ───────────────────────────────────────────────────────────

router.post('/repository/:projectId',  authMiddleware, authorizeDeployment, gitDeploymentController.configureRepository);
router.post('/webhooks/git/:provider/:projectId', gitDeploymentController.handleWebhook);
router.post('/preview/:projectId',     authMiddleware, authorizeDeployment, gitDeploymentController.createPreviewDeploy);
router.post('/schedule/:projectId',    authMiddleware, authorizeDeployment, gitDeploymentController.scheduleDeployment);
router.post('/lock/:projectId',        authMiddleware, authorizeDeployment, gitDeploymentController.toggleDeployLock);

// ── Build cache ───────────────────────────────────────────────────────────────

router.get('/cache/check/:projectId',  authMiddleware, authorizeDeployment, deploymentController.getBuildCacheStatus);
router.post('/cache/update/:projectId',authMiddleware, authorizeDeployment, gitDeploymentController.updateBuildCache);

// ── Standard CRUD ─────────────────────────────────────────────────────────────

router.post('/',                       authMiddleware, authorizeDeployment, deploymentController.createDeployment);
router.get('/',                        authMiddleware, authorizeDeployment, deploymentController.getAllDeployments);
router.get('/project/:projectId',      authMiddleware, authorizeDeployment, deploymentController.getDeployments);
router.get('/analytics/project/:projectId', authMiddleware, authorizeDeployment, deploymentController.getProjectDeploymentAnalytics);
router.get('/:id',                     authMiddleware, authorizeDeployment, deploymentController.getDeploymentById);
router.get('/:id/metrics',             authMiddleware, authorizeDeployment, deploymentController.getDeploymentMetrics);
router.patch('/:id/status', internalAuth, (req, res) => res.status(405).json({ error: 'Use the validated worker POST callback' }));
router.post('/:id/rollback',           authMiddleware, authorizeDeployment, deploymentController.rollbackDeployment);
router.get('/:id/logs',                authMiddleware, authorizeDeployment, deploymentController.getDeploymentLogs);

// ── Redeploy / rebuild actions ────────────────────────────────────────────────

/**
 * POST /api/deployments/:id/redeploy
 * Trigger a new deployment from the same project + branch (like Render's "Manual Deploy")
 */
router.post('/:id/redeploy', authMiddleware, authorizeDeployment, async (req, res, next) => {
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
router.post('/:id/assign-domain', authMiddleware, authorizeDeployment, async (req, res, next) => {
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
router.post('/:id/rebuild', authMiddleware, authorizeDeployment, async (req, res, next) => {
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
router.post('/:id/cancel', authMiddleware, authorizeDeployment, async (req, res, next) => {
    try {
        const deploymentService = require('../services/deploymentService');
        const deployment = await deploymentService.cancelDeployment(req.params.id);
        res.json({ success: true, message: 'Cancellation recorded; inspect cleanup status', deployment });
    } catch (err) { next(err); }
});

router.post('/:id/stop', authMiddleware, authorizeDeployment, async (req, res, next) => {
    try {
        const service = require('../services/deploymentService');
        const deployment = await service.getDeploymentById(req.params.id);
        if (deployment.provider !== 'custom') return res.status(501).json({ error: 'Provider runtime termination is not implemented by this endpoint' });
        const stopped = await service.updateDeploymentStatus(req.params.id, 'stopped', { rollbackReason: 'Stopped by owner' });
        res.status(202).json({ deployment: stopped, message: 'Routing withdrawn; runtime cleanup is pending worker acknowledgement' });
    } catch (error) { next(error); }
});

router.get('/:id/gateway', internalAuth, async (req, res, next) => {
    try {
        const deployment = await require('../models/Deployment').findOne({ _id: req.params.id, status: { $in: ['deploying', 'running'] } }).select('runtimeUrl').lean();
        if (!deployment?.runtimeUrl) return res.status(404).json({ error: 'Application not found' });
        const mapping = await require('../models/PortMapping').findOne({ deploymentId: req.params.id, status: 'active' }).lean();
        const target = new URL(deployment.runtimeUrl);
        if (!mapping || Number(target.port) !== mapping.containerPort || target.protocol !== 'http:' || target.username || target.password) return res.status(404).json({ error: 'Application route is not registered' });
        res.json({ target: target.origin });
    } catch (error) { next(error); }
});

router.post('/:id/claim', internalAuth, async (req, res, next) => {
    try {
        const nodeId = String(req.body.nodeId || '');
        if (!nodeId || nodeId.length > 128) return res.status(400).json({ error: 'Worker node ID is required' });
        const claimToken = randomBytes(32).toString('base64url');
        const deployment = await require('../models/Deployment').findOneAndUpdate({
            _id: req.params.id, status: { $in: ['pending', 'building'] }, workerClaimedAt: { $exists: false },
        }, { $set: { workerClaimedAt: new Date(), workerNodeId: nodeId, workerClaimHash: hashClaim(claimToken) } }, { new: true });
        if (!deployment) return res.status(409).json({ error: 'Deployment is already claimed or no longer active' });
        res.json({ claimed: true, claimToken });
    } catch (error) { next(error); }
});

router.get('/:id/worker-state', internalAuth, async (req, res, next) => {
    try {
        const deployment = await require('../models/Deployment').findById(req.params.id).select('status workerNodeId cleanupStatus runtimeUrl healthCheckPath').lean();
        if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
        res.json(deployment);
    } catch (error) { next(error); }
});

// ── Worker callbacks (internal — secured by WORKER_SECRET) ───────────────────

/**
 * POST /api/deployments/:id/logs
 * Worker appends a build/runtime log line.
 */
router.post('/:id/logs', internalAuth, workerClaim, async (req, res) => {
    try {
        const Deployment = require('../models/Deployment');
        const { message, level = 'info', timestamp } = req.body;

        if (typeof message !== 'string' || message.length > 16384 || !['info', 'warn', 'error'].includes(level)) return res.status(400).json({ error: 'Invalid deployment log' });
        const logEntry = { message: message.trim(), level, timestamp: new Date() };

        await Deployment.findByIdAndUpdate(req.params.id, {
            $push: { logs: { $each: [logEntry], $slice: -2000 } }
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
router.post('/:id/status', internalAuth, workerClaim, async (req, res, next) => {
    try {
        const dep = req.workerDeployment;
        const { status, url, rawUrl, nodeId, error, buildTime, gitCommit, imageId } = req.body;
        if (nodeId !== dep.workerNodeId) return res.status(403).json({ error: 'Worker node does not own this claim' });
        if (!['building', 'deploying', 'running', 'failed'].includes(status)) return res.status(400).json({ error: 'Invalid worker status' });
        const updates = {};
        if (gitCommit !== undefined) {
            if (!/^[a-f\d]{40}$/i.test(gitCommit)) return res.status(400).json({ error: 'Invalid commit identity' });
            updates.gitCommit = gitCommit;
        }
        if (buildTime !== undefined) {
            if (!Number.isFinite(buildTime) || buildTime < 0) return res.status(400).json({ error: 'Invalid build duration' });
            updates.buildTime = buildTime;
        }
        if (rawUrl || status === 'running') {
            const target = new URL(rawUrl || dep.runtimeUrl);
            const mapping = await require('../models/PortMapping').findOne({ deploymentId: dep._id, nodeId, status: 'active' });
            if (!mapping || target.protocol !== 'http:' || target.username || target.password || Number(target.port) !== mapping.containerPort) return res.status(409).json({ error: 'Runtime has no matching port reservation' });
            updates.runtimeUrl = target.origin;
        }
        if (status === 'running') {
            const application = new URL(url);
            if (!['https:', 'http:'].includes(application.protocol) || application.username || application.password) return res.status(400).json({ error: 'Invalid application URL' });
            if (!/^[a-f\d]{40}$/i.test(gitCommit || dep.gitCommit || '') || !/^sha256:[a-f\d]{64}$/i.test(imageId || '')) return res.status(400).json({ error: 'Resolved commit and image identity are required' });
            updates.artifact = { imageId, nodeId };
            updates[dep.environment === 'preview' ? 'previewUrl' : dep.environment === 'staging' ? 'stagingUrl' : 'productionUrl'] = application.href;
            updates.deployTime = Date.now();
        }
        if (error) updates.rollbackReason = String(error).slice(0, 2000);
        const changed = await require('../services/deploymentService').updateDeploymentStatus(dep._id, status, updates);
        _emitStatus(req.params.id, changed.status);
        res.json({ success: true, status: changed.status, version: changed.lifecycleVersion });
    } catch (error) { next(error); }
});

router.post('/:id/cleanup', internalAuth, workerClaim, async (req, res, next) => {
    try {
        const dep = req.workerDeployment;
        if (!['failed', 'cancelled', 'rolled-back', 'stopped'].includes(dep.status)) return res.status(409).json({ error: 'Active deployments cannot release runtime resources' });
        if (!['complete', 'failed'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid cleanup result' });
        if (req.body.status === 'complete') await require('../services/portManagementService').releasePort(dep._id);
        await require('../models/Deployment').updateOne({ _id: dep._id, status: dep.status }, { $set: {
            cleanupStatus: req.body.status,
            cleanupCompletedAt: req.body.status === 'complete' ? new Date() : null,
            cleanupError: req.body.status === 'failed' ? String(req.body.error || 'Worker cleanup failed').slice(0, 2000) : null,
        } });
        res.json({ success: true });
    } catch (error) { next(error); }
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
