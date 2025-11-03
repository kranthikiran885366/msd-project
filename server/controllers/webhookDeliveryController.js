const BaseController = require('./BaseController');
const webhookDeliveryService = require('../services/webhookDeliveryService');
const WebhookDelivery = require('../models/WebhookDelivery');
const Webhook = require('../models/Webhook');
const AuditLog = require('../models/AuditLog');

class WebhookDeliveryController extends BaseController {
  constructor() {
    super();
    BaseController.bindMethods(this);
  }
  /**
   * Get webhook deliveries with pagination and filters
   */
  async listDeliveries(req, res) {
    try {
      const { webhookId } = req.params;
      const { page = 1, limit = 50, status, event, dateFrom, dateTo } = req.query;
      const { userId } = req;

      // Verify webhook ownership
      const webhook = await Webhook.findById(webhookId);
      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      const result = await webhookDeliveryService.getDeliveries(webhookId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        event,
        dateFrom,
        dateTo
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get single delivery with full details
   */
  async getDelivery(req, res) {
    try {
      const { deliveryId } = req.params;
      const delivery = await webhookDeliveryService.getDelivery(deliveryId);

      res.json(delivery);
    } catch (error) {
      if (error.message === 'Delivery not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Retry failed delivery
   */
  async retryDelivery(req, res) {
    try {
      const { deliveryId } = req.params;
      const { userId } = req;

      const delivery = await webhookDeliveryService.retryDelivery(deliveryId);

      await AuditLog.create({
        userId,
        action: 'WEBHOOK_DELIVERY_RETRY',
        resourceType: 'WebhookDelivery',
        resourceId: deliveryId,
        metadata: { success: delivery.success, statusCode: delivery.statusCode }
      });

      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get delivery statistics
   */
  async getStats(req, res) {
    try {
      const { webhookId } = req.params;
      const { timeRange = 24 } = req.query;

      const stats = await webhookDeliveryService.getStats(webhookId, parseInt(timeRange));

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get statistics by event type
   */
  async getStatsByEvent(req, res) {
    try {
      const { webhookId } = req.params;
      const { timeRange = 24 } = req.query;

      const stats = await webhookDeliveryService.getStatsByEvent(webhookId, parseInt(timeRange));

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Clear old deliveries
   */
  async clearOldDeliveries(req, res) {
    try {
      const { webhookId } = req.params;
      const { daysOld = 30 } = req.body;
      const { userId } = req;

      const result = await webhookDeliveryService.clearOldDeliveries(webhookId, parseInt(daysOld));

      await AuditLog.create({
        userId,
        action: 'WEBHOOK_DELIVERIES_CLEARED',
        resourceType: 'WebhookDelivery',
        resourceId: webhookId,
        metadata: { deletedCount: result.deletedCount, daysOld }
      });

      res.json({
        message: `Deleted ${result.deletedCount} deliveries older than ${daysOld} days`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Export deliveries as CSV
   */
  async exportDeliveries(req, res) {
    try {
      const { webhookId } = req.params;
      const { status } = req.query;

      const query = { webhookId };
      if (status === 'success') query.success = true;
      if (status === 'failed') query.success = false;

      const deliveries = await WebhookDelivery.find(query).lean();

      let csv = 'ID,Event,Status,Status Code,Duration,Retries,Timestamp\n';
      deliveries.forEach(d => {
        csv += `"${d._id}","${d.event}","${d.success ? 'Success' : 'Failed'}",${d.statusCode},${d.duration}ms,${d.retryCount},${d.createdAt}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="webhook-deliveries-${webhookId}.csv"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new WebhookDeliveryController();
