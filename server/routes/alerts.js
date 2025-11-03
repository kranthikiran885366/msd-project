const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

// Get alerts for a project
router.get('/project/:projectId', authenticate, alertController.getAlerts);

// Create alert
router.post('/project/:projectId', authenticate, alertController.createAlert);

// Update alert
router.patch('/:id', authenticate, alertController.updateAlert);

// Delete alert
router.delete('/:id', authenticate, alertController.deleteAlert);

// Toggle alert
router.post('/:id/toggle', authenticate, alertController.toggleAlert);

module.exports = router;