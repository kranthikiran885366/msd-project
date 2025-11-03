const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const { authenticate } = require('../middleware/auth');

// Get metrics for a project
router.get('/project/:projectId', authenticate, metricsController.getMetrics);

// Create custom metric
router.post('/project/:projectId', authenticate, metricsController.createMetric);

// Update metric
router.patch('/:id', authenticate, metricsController.updateMetric);

// Delete metric
router.delete('/:id', authenticate, metricsController.deleteMetric);

// Toggle metric
router.post('/:id/toggle', authenticate, metricsController.toggleMetric);

module.exports = router;