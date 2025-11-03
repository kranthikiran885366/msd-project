const mongoose = require('mongoose');

const billingUsageSchema = new mongoose.Schema(
  {
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    deployments: { type: Number, default: 0 },
    bandwidth: { type: Number, default: 0 }, // in GB
    functions: { type: Number, default: 0 }, // in ms
    storage: { type: Number, default: 0 }, // in GB
    overageAmount: { type: Number, default: 0 },
    overageBreakdown: {
      deployments: { type: Number, default: 0 },
      bandwidth: { type: Number, default: 0 },
      functions: { type: Number, default: 0 },
      storage: { type: Number, default: 0 },
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
billingUsageSchema.index({ subscriptionId: 1, createdAt: -1 });
billingUsageSchema.index({ 'period.start': 1, 'period.end': 1 });

module.exports = mongoose.model('BillingUsage', billingUsageSchema);
