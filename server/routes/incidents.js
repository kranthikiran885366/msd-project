const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, incidentController.createIncident);
router.get('/project/:projectId', authMiddleware, incidentController.getIncidents);
router.get('/project/:projectId/stats', authMiddleware, incidentController.getIncidentStats);
router.get('/:id', authMiddleware, incidentController.getIncidentById);
router.patch('/:id/status', authMiddleware, incidentController.updateIncidentStatus);
router.patch('/:id/assign', authMiddleware, incidentController.assignIncident);
router.post('/:id/resolve', authMiddleware, incidentController.resolveIncident);

module.exports = router;