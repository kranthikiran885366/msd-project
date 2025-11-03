const mongoose = require('mongoose');

const uptimeMetricSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  deploymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['up', 'down', 'degraded'],
    required: true,
    index: true
  },
  responseTime: Number, // milliseconds
  statusCode: Number,
  errorMessage: String,
  checkType: {
    type: String,
    enum: ['http', 'tcp', 'ping', 'dns'],
    default: 'http'
  },
  endpoint: String,
  region: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// TTL index - auto-delete after 1 year
uptimeMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

uptimeMetricSchema.index({ projectId: 1, timestamp: -1 });
uptimeMetricSchema.index({ projectId: 1, status: 1, timestamp: -1 });

module.exports = mongoose.model('UptimeMetric', uptimeMetricSchema);