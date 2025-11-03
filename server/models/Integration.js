const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['datadog', 'grafana', 'newrelic', 'prometheus', 'slack', 'github', 'gitlab', 'custom']
  },
  name: {
    type: String,
    required: true
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active'
  },
  lastSync: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

IntegrationSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Integration', IntegrationSchema);