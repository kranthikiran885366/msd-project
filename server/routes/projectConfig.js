'use strict';
/**
 * Project configuration routes
 *
 * Mounted at /api/projects/:id  (see projects.js)
 *
 * GET    /api/projects/:id/env          — list env vars (secrets redacted)
 * POST   /api/projects/:id/env          — replace all env vars
 * PUT    /api/projects/:id/env/:key     — upsert a single env var
 * DELETE /api/projects/:id/env/:key     — delete a single env var
 * GET    /api/projects/:id/config       — get runtime config
 * POST   /api/projects/:id/config       — update runtime config
 */
const express = require('express');
const router  = express.Router({ mergeParams: true }); // gives access to :id from parent
const authMiddleware       = require('../middleware/auth');
const projectConfigService = require('../services/projectConfigService');

// All routes require authentication
router.use(authMiddleware);

// ── Environment variables ─────────────────────────────────────────────────────

/**
 * GET /api/projects/:id/env
 * Returns all env vars with secrets redacted as "****"
 */
router.get('/env', async (req, res) => {
    try {
        const vars = await projectConfigService.getEnvVariables(req.params.id, req.userId);
        res.json({ success: true, variables: vars });
    } catch (err) {
        _handleError(res, err);
    }
});

/**
 * POST /api/projects/:id/env
 * Replace the full set of env variables.
 * Body: { variables: { KEY: "value" | { value: "...", isSecret: true } } }
 */
router.post('/env', async (req, res) => {
    try {
        const { variables } = req.body;
        if (!variables || typeof variables !== 'object' || Array.isArray(variables)) {
            return res.status(400).json({ success: false, error: 'variables must be a key-value object' });
        }

        const validation = projectConfigService.validateEnvVariables(variables);
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const saved = await projectConfigService.setEnvVariables(req.params.id, req.userId, variables);
        res.json({ success: true, variables: saved });
    } catch (err) {
        _handleError(res, err);
    }
});

/**
 * PUT /api/projects/:id/env/:key
 * Upsert a single env variable.
 * Body: { value: "...", isSecret: false }
 */
router.put('/env/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { value, isSecret = false } = req.body;

        if (value === undefined || value === null) {
            return res.status(400).json({ success: false, error: 'value is required' });
        }

        const validation = projectConfigService.validateEnvVariables({ [key]: { value, isSecret } });
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const vars = await projectConfigService.upsertEnvVariable(
            req.params.id, req.userId, key, value, isSecret
        );
        res.json({ success: true, variables: vars });
    } catch (err) {
        _handleError(res, err);
    }
});

/**
 * DELETE /api/projects/:id/env/:key
 * Remove a single env variable.
 */
router.delete('/env/:key', async (req, res) => {
    try {
        const result = await projectConfigService.deleteEnvVariable(
            req.params.id, req.userId, req.params.key
        );
        res.json({ success: true, ...result });
    } catch (err) {
        _handleError(res, err);
    }
});

// ── Runtime configuration ─────────────────────────────────────────────────────

/**
 * GET /api/projects/:id/config
 * Returns build/runtime configuration (no secrets).
 */
router.get('/config', async (req, res) => {
    try {
        const config = await projectConfigService.getRuntimeConfig(req.params.id, req.userId);
        res.json({ success: true, config });
    } catch (err) {
        _handleError(res, err);
    }
});

/**
 * POST /api/projects/:id/config
 * Update build/runtime configuration.
 * Body: { buildCommand, startCommand, installCommand, port, runtime }
 */
router.post('/config', async (req, res) => {
    try {
        const { buildCommand, startCommand, installCommand, port, runtime } = req.body;

        // Validate port if provided
        if (port !== undefined) {
            const p = Number(port);
            if (!Number.isInteger(p) || p < 1 || p > 65535) {
                return res.status(400).json({ success: false, error: 'port must be an integer between 1 and 65535' });
            }
        }

        // Validate runtime if provided
        const validRuntimes = ['node', 'python', 'static', 'docker', 'auto'];
        if (runtime !== undefined && !validRuntimes.includes(runtime)) {
            return res.status(400).json({ success: false, error: `runtime must be one of: ${validRuntimes.join(', ')}` });
        }

        const config = await projectConfigService.updateRuntimeConfig(
            req.params.id, req.userId,
            { buildCommand, startCommand, installCommand, port: port ? Number(port) : undefined, runtime }
        );
        res.json({ success: true, config });
    } catch (err) {
        _handleError(res, err);
    }
});

// ── Error helper ──────────────────────────────────────────────────────────────

function _handleError(res, err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, error: err.message });
}

module.exports = router;
