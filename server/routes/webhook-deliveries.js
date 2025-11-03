const express = require('express');
const router = express.Router();
const WebhookDeliveryController = require('../controllers/webhookDeliveryController');
const authMiddleware = require('../middleware/auth');

const controller = new WebhookDeliveryController();

// Get deliveries for a specific webhook
router.get('/webhook/:webhookId', authMiddleware, controller.listDeliveries);

// Get deliveries statistics
router.get('/webhook/:webhookId/stats', authMiddleware, controller.getStats);

// Get statistics by event type
router.get('/webhook/:webhookId/stats/by-event', authMiddleware, controller.getStatsByEvent);

// Export deliveries as CSV
router.get('/webhook/:webhookId/export', authMiddleware, controller.exportDeliveries);

// Get single delivery details
router.get('/:deliveryId', authMiddleware, controller.getDelivery);

// Retry a failed delivery
router.post('/:deliveryId/retry', authMiddleware, controller.retryDelivery);

// Clear old deliveries
router.post('/webhook/:webhookId/clear', authMiddleware, controller.clearOldDeliveries);

module.exports = router;
