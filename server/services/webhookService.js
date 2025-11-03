const crypto = require("crypto")
const Webhook = require("../models/Webhook")
const webhookDeliveryService = require('./webhookDeliveryService')

class WebhookService {
  async createWebhook(projectId, url, events, secret) {
    const webhookSecret = secret || crypto.randomBytes(32).toString("hex")

    const webhook = new Webhook({
      projectId,
      url,
      events: events || [],
      secret: webhookSecret,
      isActive: true,
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
      },
    })

    await webhook.save()

    return webhook
  }

  async listWebhooks(projectId, { limit = 50, offset = 0 }) {
    const webhooks = await Webhook.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)

    const total = await Webhook.countDocuments({ projectId })

    return { webhooks, total, limit, offset }
  }

  async updateWebhook(webhookId, updates) {
    return await Webhook.findByIdAndUpdate(webhookId, updates, { new: true })
  }

  async deleteWebhook(webhookId) {
    return await Webhook.findByIdAndUpdate(
      webhookId,
      { isActive: false },
      { new: true }
    )
  }

  async testWebhook(webhookId, payload) {
    const webhook = await Webhook.findById(webhookId)
    if (!webhook) throw new Error("Webhook not found")
    // Delegate delivery and logging to webhookDeliveryService
    return webhookDeliveryService.sendWebhook(webhook, 'test', payload)
  }

  async deliverEvent(projectId, eventType, eventData) {
    const webhooks = await Webhook.find({
      projectId,
      isActive: true,
      events: eventType,
    })

    const results = []

    for (const webhook of webhooks) {
      try {
        const delivery = await webhookDeliveryService.sendWebhook(webhook, eventType, eventData)
        results.push({ webhookId: webhook._id, success: delivery.success, deliveryId: delivery._id })
      } catch (error) {
        results.push({ webhookId: webhook._id, success: false, error: error.message })
      }
    }

    return results
  }

  // Delivery orchestration is handed to webhookDeliveryService which persists deliveries and handles retry metadata
  async _deliverWithRetry(webhook, eventType, eventData, attempt = 1) {
    return webhookDeliveryService.sendWebhook(webhook, eventType, eventData)
  }

  async _deliverWebhook(webhook, payload) {
    const signature = this._generateSignature(JSON.stringify(payload), webhook.secret)

    const headers = {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      ...webhook.headers,
    }

    // The low-level HTTP delivery is now handled in webhookDeliveryService.
    // Keep a lightweight placeholder here for compatibility.
    return { statusCode: 200, message: 'ok' }
  }

  _generateSignature(payload, secret) {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex")
  }

  async getWebhookDeliveries(webhookId, { limit = 50, offset = 0 }) {
    // Proxy to webhookDeliveryService
    const page = Math.floor(offset / limit) + 1
    return webhookDeliveryService.getDeliveries(webhookId, { page, limit })
  }

  async retryDelivery(webhookId, deliveryIndex) {
    // Expect deliveryIndex to be a deliveryId for the new service
    return webhookDeliveryService.retryDelivery(deliveryIndex)
  }

  async updateRetryPolicy(webhookId, retryPolicy) {
    return await Webhook.findByIdAndUpdate(
      webhookId,
      { retryPolicy },
      { new: true }
    )
  }

  async verifyWebhookSignature(signature, payload, secret) {
    const expectedSignature = this._generateSignature(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}

module.exports = new WebhookService()
