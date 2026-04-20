'use strict';
/**
 * internalAuth — middleware for worker-to-backend callback routes.
 *
 * Workers must send:
 *   Authorization: Bearer <WORKER_SECRET>
 *
 * If WORKER_SECRET is not configured the middleware logs a warning and
 * allows the request through (development convenience). In production
 * WORKER_SECRET must be set.
 */
const config = require('../config/env');

module.exports = function internalAuth(req, res, next) {
    const secret = config.workerSecret;

    // If no secret configured, warn and pass through (dev mode only)
    if (!secret) {
        if (config.nodeEnv === 'production') {
            return res.status(401).json({ error: 'Internal auth not configured' });
        }
        return next();
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token || token !== secret) {
        return res.status(401).json({ error: 'Invalid worker credentials' });
    }

    next();
};
