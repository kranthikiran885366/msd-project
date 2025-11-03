const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

// Dashboard overview
router.get('/', authMiddleware, dashboardController.getDashboard);
router.get('/stats', authMiddleware, dashboardController.getStats);
router.get('/recent-activity', authMiddleware, dashboardController.getRecentActivity);
router.get('/metrics', authMiddleware, dashboardController.getMetrics);

module.exports = router;