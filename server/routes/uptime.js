const express = require('express');
const router = express.Router();
const uptimeController = require('../controllers/uptimeController');
const authMiddleware = require('../middleware/auth');

router.get('/project/:projectId/stats', authMiddleware, uptimeController.getUptimeStats);
router.get('/project/:projectId/sla', authMiddleware, uptimeController.getSLAStatus);
router.get('/project/:projectId/history', authMiddleware, uptimeController.getUptimeHistory);
router.get('/project/:projectId/incidents', authMiddleware, uptimeController.getIncidentHistory);

module.exports = router;