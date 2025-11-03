const mongoose = require('mongoose');

const WebhookDeliverySchema = new mongoose.Schema({
  webhookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Webhook',
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  deliveryTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  statusCode: {
    type: Number,
    default: null
  },
  response: {
    headers: mongoose.Schema.Types.Mixed,
    body: String,
    error: String
  },
  retryCount: {
    type: Number,
    default: 0,
    index: true
  },
  maxRetries: {
    type: Number,
    default: 5
  },
  nextRetryTime: {
    type: Date,
    default: null,
    index: true
  },
  success: {
    type: Boolean,
    default: false,
    index: true
  },
  duration: Number,
  userAgent: String,
  ipAddress: String,
  attempts: [{
    timestamp: Date,
    statusCode: Number,
    success: Boolean,
    error: String,
    duration: Number
  }]
}, { timestamps: true });

// TTL index - auto-delete after 90 days
WebhookDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Compound indexes for queries
WebhookDeliverySchema.index({ webhookId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ projectId: 1, success: 1 });
WebhookDeliverySchema.index({ event: 1, success: 1 });

module.exports = mongoose.model('WebhookDelivery', WebhookDeliverySchema);
