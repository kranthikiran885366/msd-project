const mongoose = require('mongoose');

const billingCycleSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  usage: {
    bandwidth: {
      total: Number,
      breakdown: [{
        date: Date,
        amount: Number,
        service: String,
      }],
    },
    functions: {
      totalMs: Number,
      breakdown: [{
        date: Date,
        functionId: mongoose.Schema.Types.ObjectId,
        executionTime: Number,
        memory: Number,
      }],
    },
    storage: {
      total: Number,
      breakdown: [{
        date: Date,
        serviceType: String,
        amount: Number,
      }],
    },
    deployments: [{
      date: Date,
      deploymentId: mongoose.Schema.Types.ObjectId,
      type: String,
    }],
  },
  costs: {
    basePlan: Number,
    overages: {
      bandwidth: Number,
      functions: Number,
      storage: Number,
      deployments: Number,
      total: Number,
    },
    addons: [{
      name: String,
      cost: Number,
    }],
    total: Number,
  },
});

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'cancelled', 'trialing'],
    default: 'active',
  },
  currentPeriod: {
    start: Date,
    end: Date,
  },
  paymentMethod: {
    id: String,
    type: {
      type: String,
      enum: ['card', 'bank_account', 'wire'],
    },
    brand: String,
    last4: String,
    expMonth: Number,
    expYear: Number,
    default: Boolean,
  },
  billingAddress: {
    name: String,
    company: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String,
    vat: String,
  },
  billingEmail: String,
  invoiceSettings: {
    frequency: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    autopay: {
      type: Boolean,
      default: true,
    },
    grace_period: {
      type: Number,
      default: 3, // days
    },
  },
  billing_cycles: [billingCycleSchema],
  addons: [{
    id: String,
    name: String,
    quantity: Number,
    unit_price: Number,
  }],
  metadata: {
    promotion: {
      code: String,
      expires: Date,
      discount: Number,
    },
    customLimits: {
      bandwidth: Number,
      functions: Number,
      storage: Number,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  cancelledAt: Date,
  trialEndsAt: Date,
});

subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate current usage against plan limits
subscriptionSchema.methods.checkUsage = async function() {
  const currentCycle = this.billing_cycles.find(cycle => {
    return cycle.startDate <= new Date() && cycle.endDate >= new Date();
  });

  if (!currentCycle) return null;

  const plan = await mongoose.model('Plan').findById(this.plan);
  const usage = currentCycle.usage;
  const limits = plan.limits;

  return {
    bandwidth: {
      used: usage.bandwidth.total,
      limit: limits.bandwidth.gb,
      percentage: (usage.bandwidth.total / limits.bandwidth.gb) * 100,
    },
    functions: {
      used: usage.functions.totalMs,
      limit: limits.functions.executionTime,
      percentage: (usage.functions.totalMs / limits.functions.executionTime) * 100,
    },
    storage: {
      used: usage.storage.total,
      limit: limits.storage.gb,
      percentage: (usage.storage.total / limits.storage.gb) * 100,
    },
    deployments: {
      used: usage.deployments.length,
      limit: limits.deployments.perMonth,
      percentage: (usage.deployments.length / limits.deployments.perMonth) * 100,
    },
  };
};

// Calculate estimated cost for current billing cycle
subscriptionSchema.methods.estimateCost = async function() {
  const currentCycle = this.billing_cycles[this.billing_cycles.length - 1];
  const plan = await mongoose.model('Plan').findById(this.plan);
  
  const baseCost = plan.price.amount;
  const overageCost = plan.calculateOverage(currentCycle.usage);
  const addonsCost = this.addons.reduce((total, addon) => total + (addon.quantity * addon.unit_price), 0);
  
  return {
    base: baseCost,
    overage: overageCost,
    addons: addonsCost,
    total: baseCost + overageCost + addonsCost,
  };
};

module.exports = mongoose.model('Subscription', subscriptionSchema);