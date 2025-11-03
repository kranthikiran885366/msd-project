const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['free', 'hobby', 'pro', 'business', 'enterprise'],
  },
  displayName: {
    type: String,
    required: true,
  },
  price: {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
  },
  features: [{
    name: String,
    description: String,
    value: mongoose.Schema.Types.Mixed,
  }],
  limits: {
    bandwidth: {
      gb: Number,
      overage: Number, // Cost per GB over limit
    },
    functions: {
      executionTime: Number, // in milliseconds
      concurrency: Number,
      memory: Number, // in MB
      overage: Number, // Cost per million ms over limit
    },
    storage: {
      gb: Number,
      overage: Number, // Cost per GB over limit
    },
    deployments: {
      perMonth: Number,
      overage: Number, // Cost per deployment over limit
    },
    databases: {
      count: Number,
      size: Number, // in GB
    },
    teamMembers: {
      count: Number,
      overage: Number, // Cost per additional member
    },
    apiRateLimit: {
      requestsPerSecond: Number,
      burstLimit: Number,
    },
  },
  metadata: {
    popular: Boolean,
    hidden: Boolean,
    minimumTerm: Number, // in months
    customizable: Boolean,
  },
  support: {
    responseTime: String,
    channels: [String],
    sla: {
      uptime: Number,
      response: Number,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

planSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods to calculate costs
planSchema.methods.calculateOverage = function(usage) {
  let overageCost = 0;
  
  // Calculate bandwidth overage
  if (usage.bandwidth > this.limits.bandwidth.gb) {
    overageCost += (usage.bandwidth - this.limits.bandwidth.gb) * this.limits.bandwidth.overage;
  }
  
  // Calculate function execution overage
  if (usage.functionsMs > this.limits.functions.executionTime) {
    overageCost += (usage.functionsMs - this.limits.functions.executionTime) * this.limits.functions.overage;
  }
  
  // Calculate storage overage
  if (usage.storage > this.limits.storage.gb) {
    overageCost += (usage.storage - this.limits.storage.gb) * this.limits.storage.overage;
  }
  
  return overageCost;
};

// Static method to get all visible plans
planSchema.statics.getPublicPlans = function() {
  return this.find({
    'metadata.hidden': false,
  }).sort({ 'price.amount': 1 });
};

module.exports = mongoose.model('Plan', planSchema);