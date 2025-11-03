const webhookService = require("../services/webhookService")
const Webhook = require("../models/Webhook")
const AuditLog = require("../models/AuditLog")

// Webhook Management
exports.createWebhook = async (req, res) => {
  try {
    const { projectId, url, events, secret, active } = req.body
    const { userId } = req

    const webhook = await webhookService.createWebhook({
      projectId,
      url,
      events,
      secret,
      active,
      createdBy: userId,
    })

    await AuditLog.create({
      userId,
      action: "WEBHOOK_CREATED",
      resourceType: "Webhook",
      resourceId: webhook._id,
      metadata: { url, events },
    })

    res.status(201).json(webhook)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listWebhooks = async (req, res) => {
  try {
    const { projectId } = req.query

    const webhooks = await Webhook.find({
      projectId,
    }).select("-secret")

    res.json(webhooks)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params

    const webhook = await Webhook.findById(webhookId).select("-secret")

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" })
    }

    res.json(webhook)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params
    const { url, events, secret, active } = req.body
    const { userId } = req

    const webhook = await Webhook.findByIdAndUpdate(
      webhookId,
      {
        url,
        events,
        secret,
        active,
        updatedAt: new Date(),
      },
      { new: true }
    ).select("-secret")

    await AuditLog.create({
      userId,
      action: "WEBHOOK_UPDATED",
      resourceType: "Webhook",
      resourceId: webhookId,
      metadata: { url, events },
    })

    res.json(webhook)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params
    const { userId } = req

    await Webhook.findByIdAndDelete(webhookId)

    await AuditLog.create({
      userId,
      action: "WEBHOOK_DELETED",
      resourceType: "Webhook",
      resourceId: webhookId,
      metadata: {},
    })

    res.json({ message: "Webhook deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Webhook Testing
exports.testWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params
    const { eventType, payload } = req.body
    const { userId } = req

    const result = await webhookService.testWebhook(webhookId, eventType, payload)

    await AuditLog.create({
      userId,
      action: "WEBHOOK_TESTED",
      resourceType: "Webhook",
      resourceId: webhookId,
      metadata: { eventType, success: result.success },
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Webhook Delivery
exports.getDeliveries = async (req, res) => {
  try {
    const { webhookId, status, limit = 50, skip = 0 } = req.query

    const query = { webhookId }
    if (status) query.status = status

    const deliveries = await webhookService.getDeliveries(query, parseInt(limit), parseInt(skip))

    res.json(deliveries)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params

    const delivery = await webhookService.getDeliveryById(deliveryId)

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" })
    }

    res.json(delivery)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.retryDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params
    const { userId } = req

    const result = await webhookService.retryDelivery(deliveryId)

    await AuditLog.create({
      userId,
      action: "WEBHOOK_DELIVERY_RETRIED",
      resourceType: "WebhookDelivery",
      resourceId: deliveryId,
      metadata: { success: result.success },
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Webhook Statistics
exports.getStatistics = async (req, res) => {
  try {
    const { webhookId, timeRange = 7 } = req.query

    const stats = await webhookService.getWebhookStatistics(webhookId, parseInt(timeRange))

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getProjectStatistics = async (req, res) => {
  try {
    const { projectId, timeRange = 7 } = req.query

    const stats = await webhookService.getProjectWebhookStatistics(projectId, parseInt(timeRange))

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Webhook Events
exports.listEvents = async (req, res) => {
  try {
    const events = await webhookService.listAvailableEvents()

    res.json(events)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Bulk Operations
exports.bulkDisable = async (req, res) => {
  try {
    const { webhookIds } = req.body
    const { userId } = req

    const result = await webhookService.bulkDisableWebhooks(webhookIds)

    await AuditLog.create({
      userId,
      action: "WEBHOOKS_BULK_DISABLED",
      resourceType: "Webhook",
      resourceId: null,
      metadata: { count: webhookIds.length },
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.clearDeliveries = async (req, res) => {
  try {
    const { webhookId, before } = req.body
    const { userId } = req

    const result = await webhookService.clearDeliveries(webhookId, new Date(before))

    await AuditLog.create({
      userId,
      action: "WEBHOOK_DELIVERIES_CLEARED",
      resourceType: "Webhook",
      resourceId: webhookId,
      metadata: { before, count: result.deletedCount },
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
