const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { validatePlan } = require('../middleware/planValidation');

// Public routes (no auth required)
router.get('/plans', rateLimiter(), billingController.getPlans);

// Protected routes
router.use(authenticate);

// Subscription management
router.get('/subscription', billingController.getCurrentSubscription);
router.post('/subscription', validatePlan, billingController.createSubscription);
router.put('/subscription/:id', validatePlan, billingController.updateSubscription);
router.delete('/subscription/:id', billingController.cancelSubscription);

// Usage and analytics
router.get('/subscription/:id/usage', billingController.getUsageAnalytics);
router.post('/subscription/:id/usage', billingController.recordUsage);

module.exports = router;