const express = require('express');
// `auth.js` exports the middleware function directly (module.exports = authMiddleware)
// so require it as a value instead of destructuring.
const authenticate = require('./auth');
const { createRateLimiter } = require('./rateLimiter');
const planValidation = require('./planValidation');
const { validateFeature } = planValidation;

const featureMiddleware = (featureName) => {
  return [
    authenticate,
    createRateLimiter(),
    validateFeature(featureName),
  ];
};

module.exports = {
  // Feature access middleware configurations
  splitTesting: featureMiddleware('splitTesting'),
  blueprints: featureMiddleware('blueprints'),
  isrConfig: featureMiddleware('isrConfig'),
  edgeHandlers: featureMiddleware('edgeHandlers'),
  mediaCdn: featureMiddleware('mediaCdn'),
  multiRegion: featureMiddleware('multiRegion'),
  
  // Additional middleware for specific feature requirements
  mediaCdnUpload: [
    ...featureMiddleware('mediaCdn'),
    (req, res, next) => {
      // Additional file upload validations
      const maxFileSize = req.user.plan.limits.mediaCdn.maxFileSize;
      if (req.file && req.file.size > maxFileSize) {
        return res.status(413).json({
          error: 'File too large',
          message: `Files must be under ${maxFileSize / (1024 * 1024)}MB for your plan.`,
        });
      }
      next();
    },
  ],

  multiRegionDeploy: [
    ...featureMiddleware('multiRegion'),
    (req, res, next) => {
      // Additional deployment validations
      const maxRegions = req.user.plan.limits.multiRegion.maxRegions;
      if (req.body.regions && req.body.regions.length > maxRegions) {
        return res.status(403).json({
          error: 'Region limit exceeded',
          message: `Your plan allows deployment to ${maxRegions} regions.`,
        });
      }
      next();
    },
  ],

  edgeHandlerValidation: [
    ...featureMiddleware('edgeHandlers'),
    (req, res, next) => {
      // Additional edge handler validations
      const maxHandlers = req.user.plan.limits.edgeHandlers.maxHandlers;
      if (req.method === 'POST') {
        // Check current handler count before allowing new ones
        const currentHandlers = req.user.edgeHandlers?.length || 0;
        if (currentHandlers >= maxHandlers) {
          return res.status(403).json({
            error: 'Handler limit reached',
            message: `Your plan allows up to ${maxHandlers} edge handlers.`,
          });
        }
      }
      next();
    },
  ],
};