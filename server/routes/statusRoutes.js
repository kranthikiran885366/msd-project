const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/health', statusController.getHealthCheck);
router.get('/system', statusController.getSystemStatus);

// Protected routes
router.use(authenticate);
router.get('/metrics/:serviceName', statusController.getServiceMetrics);
router.get('/incidents', statusController.getIncidents);
router.post('/incidents', statusController.createIncident);
router.patch('/incidents/:incidentId', statusController.updateIncidentStatus);
router.post('/subscribe', statusController.subscribeToUpdates);

module.exports = router;