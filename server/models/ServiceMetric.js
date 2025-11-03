const mongoose = require('mongoose');

const ServiceMetricSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
    enum: [
      'API Servers',
      'Build Infrastructure',
      'CDN & Storage',
      'Database Cluster',
      'SSL/TLS Services',
      'Dashboard & Control Panel'
    ]
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  metrics: {
    latency: {
      type: Number,  // in milliseconds
      required: true
    },
    errorRate: {
      type: Number,  // percentage
      required: true
    },
    requestCount: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,  // percentage
      required: true
    },
    cpuUsage: {
      type: Number,  // percentage
      required: true
    },
    memoryUsage: {
      type: Number,  // percentage
      required: true
    },
    customMetrics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  region: {
    type: String,
    required: true,
    enum: ['US East', 'US West', 'EU West', 'Asia Pacific', 'Global']
  },
  alerts: [{
    type: {
      type: String,
      enum: ['high_latency', 'high_error_rate', 'high_cpu', 'high_memory', 'custom']
    },
    message: String,
    threshold: Number,
    currentValue: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true 
});

// Indexes for efficient querying
ServiceMetricSchema.index({ serviceName: 1, timestamp: -1 });
ServiceMetricSchema.index({ region: 1, timestamp: -1 });
ServiceMetricSchema.index({ 'metrics.errorRate': 1 });
ServiceMetricSchema.index({ 'metrics.latency': 1 });

module.exports = mongoose.model('ServiceMetric', ServiceMetricSchema);