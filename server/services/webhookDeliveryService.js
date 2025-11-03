const axios = require('axios');
const WebhookDelivery = require('../models/WebhookDelivery');
const crypto = require('crypto');

class WebhookDeliveryService {
    async sendWebhook(webhook, eventType, payload) {
        const delivery = await WebhookDelivery.create({
            webhookId: webhook._id,
            eventType,
            payload,
            status: 'pending',
            attempt: 1,
            startTime: new Date()
        });

        try {
            const result = await this._deliverWebhook(webhook, payload);
            
            await WebhookDelivery.findByIdAndUpdate(delivery._id, {
                status: 'success',
                statusCode: result.statusCode,
                response: result.data,
                endTime: new Date(),
                duration: Date.now() - delivery.startTime.getTime()
            });

            return delivery;
        } catch (error) {
            await WebhookDelivery.findByIdAndUpdate(delivery._id, {
                status: 'failed',
                statusCode: error.response?.status,
                error: error.message,
                response: error.response?.data,
                endTime: new Date(),
                duration: Date.now() - delivery.startTime.getTime()
            });

            // Schedule retry if within retry policy
            const retryPolicy = webhook.retryPolicy || { maxAttempts: 3 };
            if (delivery.attempt < retryPolicy.maxAttempts) {
                await this.scheduleRetry(delivery._id, retryPolicy);
            }

            throw error;
        }
    }

    async _deliverWebhook(webhook, payload) {
        const signature = this._generateSignature(JSON.stringify(payload), webhook.secret);

        const headers = {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'User-Agent': 'Deployment-Framework-Webhook',
            ...webhook.headers
        };

        const response = await axios({
            method: 'POST',
            url: webhook.url,
            headers,
            data: payload,
            timeout: 10000 // 10 second timeout
        });

        return {
            statusCode: response.status,
            data: response.data
        };
    }

    _generateSignature(payload, secret) {
        return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }

    async scheduleRetry(deliveryId, retryPolicy) {
        const delivery = await WebhookDelivery.findById(deliveryId);
        if (!delivery) throw new Error('Delivery not found');

        const backoffDelay = this._calculateBackoffDelay(delivery.attempt, retryPolicy);
        const nextAttemptTime = new Date(Date.now() + backoffDelay);

        await WebhookDelivery.findByIdAndUpdate(deliveryId, {
            nextAttemptTime,
            status: 'scheduled'
        });
    }

    _calculateBackoffDelay(attempt, retryPolicy) {
        const {
            initialDelayMs = 1000,
            backoffMultiplier = 2,
            maxDelayMs = 1800000 // 30 minutes
        } = retryPolicy;

        const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
        return Math.min(delay, maxDelayMs);
    }

    async retryDelivery(deliveryId) {
        const delivery = await WebhookDelivery.findById(deliveryId).populate('webhookId');
        if (!delivery) throw new Error('Delivery not found');
        if (!delivery.webhookId) throw new Error('Associated webhook not found');

        const newDelivery = await WebhookDelivery.create({
            webhookId: delivery.webhookId._id,
            eventType: delivery.eventType,
            payload: delivery.payload,
            status: 'pending',
            attempt: delivery.attempt + 1,
            startTime: new Date(),
            previousAttemptId: delivery._id
        });

        try {
            const result = await this._deliverWebhook(delivery.webhookId, delivery.payload);
            
            await WebhookDelivery.findByIdAndUpdate(newDelivery._id, {
                status: 'success',
                statusCode: result.statusCode,
                response: result.data,
                endTime: new Date(),
                duration: Date.now() - newDelivery.startTime.getTime()
            });

            return newDelivery;
        } catch (error) {
            await WebhookDelivery.findByIdAndUpdate(newDelivery._id, {
                status: 'failed',
                statusCode: error.response?.status,
                error: error.message,
                response: error.response?.data,
                endTime: new Date(),
                duration: Date.now() - newDelivery.startTime.getTime()
            });

            throw error;
        }
    }

    async getDeliveries(webhookId, { page = 1, limit = 50 } = {}) {
        const deliveries = await WebhookDelivery.find({ webhookId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await WebhookDelivery.countDocuments({ webhookId });

        return {
            deliveries,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getDelivery(deliveryId) {
        const delivery = await WebhookDelivery.findById(deliveryId);
        if (!delivery) throw new Error('Delivery not found');
        return delivery;
    }

    async processScheduledDeliveries() {
        const now = new Date();
        const scheduledDeliveries = await WebhookDelivery.find({
            status: 'scheduled',
            nextAttemptTime: { $lte: now }
        }).populate('webhookId');

        for (const delivery of scheduledDeliveries) {
            try {
                await this.retryDelivery(delivery._id);
            } catch (error) {
                console.error(`Failed to process scheduled delivery ${delivery._id}:`, error);
            }
        }
    }

    async cleanupOldDeliveries(daysOld = 30) {
        const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        return await WebhookDelivery.deleteMany({
            createdAt: { $lt: cutoff },
            status: { $in: ['success', 'failed'] }
        });
    }
}

module.exports = new WebhookDeliveryService();
