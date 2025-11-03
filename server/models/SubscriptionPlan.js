const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // 'free', 'pro', 'enterprise'
    displayName: { type: String, required: true }, // 'Free', 'Pro', 'Enterprise'
    description: String,
    price: { type: Number, default: 0 }, // Monthly price in USD
    stripePriceId: { type: String }, // Stripe price ID
    stripeProductId: { type: String }, // Stripe product ID
    active: { type: Boolean, default: true },
    tier: { type: Number, required: true }, // 1 = free, 2 = pro, 3 = enterprise
    features: [String], // List of feature names included
    usageLimits: {
      deployments: Number, // per month
      bandwidth: Number, // in GB per month
      functions: Number, // execution time in ms per month
      storage: Number, // in GB
      teamMembers: Number,
      concurrentBuilds: { type: Number, default: 1 },
      apiRequests: Number, // per month
      customDomains: Number,
      envVariables: Number,
    },
    overagePricing: {
      deployments: { type: Number, default: 0.10 }, // per deployment
      bandwidth: { type: Number, default: 0.05 }, // per GB
      functions: { type: Number, default: 0.0000000150 }, // per ms
      storage: { type: Number, default: 0.025 }, // per GB
      teamMembers: { type: Number, default: 5 }, // per member
      customDomains: { type: Number, default: 5 }, // per domain
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'usage-based'],
      default: 'monthly',
    },
    support: {
      email: { type: Boolean, default: true },
      chat: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
      sla: { type: String }, // e.g., '99.9%'
      responseTime: { type: Number }, // in hours
    },
    metadata: {
      recommended: { type: Boolean, default: false },
      color: String,
      icon: String,
    },
  },
  { timestamps: true }
);

// Pre-save validation
subscriptionPlanSchema.pre('save', function(next) {
  if (this.usageLimits.deployments && this.usageLimits.deployments < 0) {
    return next(new Error('Deployment limit cannot be negative'));
  }
  next();
});

// Method to calculate overage cost
subscriptionPlanSchema.methods.calculateOverage = function(usage) {
  let total = 0;

  if (usage.deployments && this.overagePricing.deployments) {
    const overage = Math.max(0, usage.deployments - this.usageLimits.deployments);
    total += overage * this.overagePricing.deployments;
  }

  if (usage.bandwidth && this.overagePricing.bandwidth) {
    const overage = Math.max(0, usage.bandwidth - this.usageLimits.bandwidth);
    total += overage * this.overagePricing.bandwidth;
  }

  if (usage.functions && this.overagePricing.functions) {
    const overage = Math.max(0, usage.functions - this.usageLimits.functions);
    total += overage * this.overagePricing.functions;
  }

  if (usage.storage && this.overagePricing.storage) {
    const overage = Math.max(0, usage.storage - this.usageLimits.storage);
    total += overage * this.overagePricing.storage;
  }

  return total;
};

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
