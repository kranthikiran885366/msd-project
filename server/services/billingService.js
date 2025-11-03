const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const { stripe } = require('../utils/stripe');

class BillingService {
  async getPlans() {
    const plans = await Plan.getPublicPlans();
    return plans;
  }

  async getPlan(planId) {
    return Plan.findById(planId);
  }

  async getSubscription(userId, organizationId = null) {
    const query = { userId };
    if (organizationId) query.organizationId = organizationId;
    
    return Subscription.findOne(query)
      .populate('plan')
      .sort({ createdAt: -1 });
  }

  async createSubscription(userId, planId, paymentMethodId, options = {}) {
    const plan = await Plan.findById(planId);
    if (!plan) throw new Error('Plan not found');

    // Create or update Stripe customer
    const stripeCustomer = await this._createOrUpdateStripeCustomer(userId, paymentMethodId);

    // Create subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{ price: plan.stripe_price_id }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      ...options,
    });

    // Create local subscription
    const subscription = new Subscription({
      userId,
      plan: planId,
      status: 'active',
      currentPeriod: {
        start: new Date(stripeSubscription.current_period_start * 1000),
        end: new Date(stripeSubscription.current_period_end * 1000),
      },
      paymentMethod: await this._formatPaymentMethod(paymentMethodId),
      billing_cycles: [{
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usage: {
          bandwidth: { total: 0, breakdown: [] },
          functions: { totalMs: 0, breakdown: [] },
          storage: { total: 0, breakdown: [] },
          deployments: [],
        },
        costs: {
          basePlan: plan.price.amount,
          overages: {
            bandwidth: 0,
            functions: 0,
            storage: 0,
            deployments: 0,
            total: 0,
          },
          addons: [],
          total: plan.price.amount,
        },
      }],
    });

    await subscription.save();
    return subscription;
  }

  async updateSubscription(subscriptionId, updates) {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    // Handle plan change
    if (updates.planId && updates.planId !== subscription.plan.toString()) {
      const newPlan = await Plan.findById(updates.planId);
      if (!newPlan) throw new Error('New plan not found');

      // Update Stripe subscription
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        proration_behavior: updates.prorate ? 'create_prorations' : 'none',
        items: [{
          id: subscription.stripe_subscription_item_id,
          price: newPlan.stripe_price_id,
        }],
      });

      subscription.plan = updates.planId;
    }

    // Handle payment method update
    if (updates.paymentMethodId) {
      subscription.paymentMethod = await this._formatPaymentMethod(updates.paymentMethodId);
    }

    // Handle other updates
    if (updates.billingAddress) subscription.billingAddress = updates.billingAddress;
    if (updates.billingEmail) subscription.billingEmail = updates.billingEmail;
    if (updates.invoiceSettings) subscription.invoiceSettings = updates.invoiceSettings;

    await subscription.save();
    return subscription;
  }

  async cancelSubscription(subscriptionId, options = {}) {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    // Cancel in Stripe
    await stripe.subscriptions.del(subscription.stripe_subscription_id, {
      prorate: options.prorate,
    });

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    return subscription;
  }

  async recordUsage(subscriptionId, usageData) {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const currentCycle = subscription.billing_cycles[subscription.billing_cycles.length - 1];

    // Update usage metrics
    if (usageData.bandwidth) {
      currentCycle.usage.bandwidth.total += usageData.bandwidth.amount;
      currentCycle.usage.bandwidth.breakdown.push({
        date: new Date(),
        amount: usageData.bandwidth.amount,
        service: usageData.bandwidth.service,
      });
    }

    if (usageData.functions) {
      currentCycle.usage.functions.totalMs += usageData.functions.executionTime;
      currentCycle.usage.functions.breakdown.push({
        date: new Date(),
        functionId: usageData.functions.functionId,
        executionTime: usageData.functions.executionTime,
        memory: usageData.functions.memory,
      });
    }

    if (usageData.storage) {
      currentCycle.usage.storage.total += usageData.storage.amount;
      currentCycle.usage.storage.breakdown.push({
        date: new Date(),
        serviceType: usageData.storage.type,
        amount: usageData.storage.amount,
      });
    }

    if (usageData.deployment) {
      currentCycle.usage.deployments.push({
        date: new Date(),
        deploymentId: usageData.deployment.id,
        type: usageData.deployment.type,
      });
    }

    // Calculate costs
    const plan = await Plan.findById(subscription.plan);
    const overages = plan.calculateOverage(currentCycle.usage);
    currentCycle.costs.overages = {
      bandwidth: overages.bandwidth || 0,
      functions: overages.functions || 0,
      storage: overages.storage || 0,
      deployments: overages.deployments || 0,
      total: overages.total || 0,
    };
    currentCycle.costs.total = currentCycle.costs.basePlan + 
      currentCycle.costs.overages.total +
      currentCycle.costs.addons.reduce((sum, addon) => sum + addon.cost, 0);

    await subscription.save();
    return subscription;
  }

  async getUsageAnalytics(subscriptionId, options = {}) {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const currentCycle = subscription.billing_cycles[subscription.billing_cycles.length - 1];
    const plan = await Plan.findById(subscription.plan);

    return {
      current: await subscription.checkUsage(),
      estimated: await subscription.estimateCost(),
      breakdown: {
        bandwidth: this._analyzeUsage(currentCycle.usage.bandwidth.breakdown, options),
        functions: this._analyzeUsage(currentCycle.usage.functions.breakdown, options),
        storage: this._analyzeUsage(currentCycle.usage.storage.breakdown, options),
        deployments: this._analyzeUsage(currentCycle.usage.deployments, options),
      },
      limits: plan.limits,
    };
  }

  _analyzeUsage(data, options) {
    const { interval = 'day', start, end } = options;
    const filtered = data.filter(item => {
      const date = item.date || item.timestamp;
      return (!start || date >= start) && (!end || date <= end);
    });

    return {
      total: filtered.length,
      timeline: this._groupByInterval(filtered, interval),
    };
  }

  _groupByInterval(data, interval) {
    // Group usage data by specified interval (hour, day, week, month)
    const groups = {};
    data.forEach(item => {
      const date = item.date || item.timestamp;
      const key = this._getIntervalKey(date, interval);
      if (!groups[key]) groups[key] = 0;
      groups[key] += item.amount || 1;
    });
    return groups;
  }

  _getIntervalKey(date, interval) {
    const d = new Date(date);
    switch (interval) {
      case 'hour':
        return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:00`;
      case 'day':
        return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      case 'week':
        const week = Math.floor(d.getDate() / 7);
        return `${d.getFullYear()}-${d.getMonth()+1}-W${week}`;
      case 'month':
        return `${d.getFullYear()}-${d.getMonth()+1}`;
      default:
        return d.toISOString();
    }
  }

  async _createOrUpdateStripeCustomer(userId, paymentMethodId) {
    // Implementation depends on your user model and Stripe integration
    // This is a placeholder for the actual implementation
    return { id: 'dummy_stripe_customer_id' };
  }

  async _formatPaymentMethod(paymentMethodId) {
    // Implementation depends on your Stripe integration
    // This is a placeholder for the actual implementation
    return {
      id: paymentMethodId,
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
      default: true,
    };
  }
}

module.exports = new BillingService();