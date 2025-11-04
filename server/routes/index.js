const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Import all feature routers - Existing features
const splitTestingRoutes = require('./split-testing');
const blueprintRoutes = require('./blueprints');
const isrConfigRoutes = require('./isr-config');
const edgeHandlerRoutes = require('./edge-handlers');
const mediaCdnRoutes = require('./media-cdn');
const multiRegionRoutes = require('./multi-region');
const billingRoutes = require('./billing');

// Import team management routes
const teamGroupRoutes = require('./teamGroups');
const ssoRoutes = require('./sso');
const billingContactRoutes = require('./billingContacts');

// Import all feature routers - New features (1-15)
const buildRoutes = require('./builds');
const functionRoutes = require('./functions');
const securityRoutes = require('./security');
const analyticsRoutes = require('./analytics');
const teamRoutes = require('./team');
const databaseRoutes = require('./databases');
const apiTokenRoutes = require('./api-tokens');
const webhookRoutes = require('./webhooks');
const settingsRoutes = require('./settings');
const webhookDeliveriesRoutes = require('./webhook-deliveries');
const notificationRoutes = require('./notifications');
const dashboardRoutes = require('./dashboard');
const helpRoutes = require('./help');
const statusRoutes = require('./status');
const adminRoutes = require('./admin');
const integrationRoutes = require('./integrations');

// Deployment Management Routes
const alertRoutes = require('./alerts');
const incidentRoutes = require('./incidents');
const escalationRoutes = require('./escalation');
const uptimeRoutes = require('./uptime');
const metricsRoutes = require('./metrics');
const reportsRoutes = require('./reports');
const deploymentRoutes = require('./deployments');

// Existing feature routes
router.use('/split-testing', authenticate, splitTestingRoutes);
router.use('/blueprints', authenticate, blueprintRoutes);
router.use('/isr-config', authenticate, isrConfigRoutes);
router.use('/edge-handlers', authenticate, edgeHandlerRoutes);
router.use('/media-cdn', authenticate, mediaCdnRoutes);
router.use('/multi-region', authenticate, multiRegionRoutes);
router.use('/billing', billingRoutes);

// Team management routes
router.use('/team/groups', authenticate, teamGroupRoutes);
router.use('/team/sso', authenticate, ssoRoutes);
router.use('/team/billing-contacts', authenticate, billingContactRoutes);

// New feature routes (1-15)
router.use('/builds', authenticate, buildRoutes);
router.use('/functions', authenticate, functionRoutes);
router.use('/security', authenticate, securityRoutes);
router.use('/analytics', authenticate, analyticsRoutes);
router.use('/team', authenticate, teamRoutes);
router.use('/databases', authenticate, databaseRoutes);
router.use('/api-tokens', authenticate, apiTokenRoutes);
router.use('/webhooks', authenticate, webhookRoutes);
router.use('/settings', authenticate, settingsRoutes);
router.use('/webhook-deliveries', authenticate, webhookDeliveriesRoutes);
router.use('/notifications', authenticate, notificationRoutes);
router.use('/dashboard', authenticate, dashboardRoutes);
router.use('/help', helpRoutes);
router.use('/status', statusRoutes);
router.use('/admin', authenticate, adminRoutes);
router.use('/integrations', authenticate, integrationRoutes);

// Deployment Management Routes
router.use('/alerts', authenticate, alertRoutes);
router.use('/incidents', authenticate, incidentRoutes);
router.use('/escalation', authenticate, escalationRoutes);
router.use('/uptime', authenticate, uptimeRoutes);
router.use('/metrics', authenticate, metricsRoutes);
router.use('/reports', authenticate, reportsRoutes);
router.use('/deployments', authenticate, deploymentRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// API status endpoint
router.get('/status', authenticate, (req, res) => {
  res.json({ 
    status: 'online',
    user: req.user,
    timestamp: new Date()
  });
});

module.exports = router;