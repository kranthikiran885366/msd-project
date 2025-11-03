const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const BillingUsage = require('../models/BillingUsage');

/**
 * Enterprise-grade Stripe Billing Service
 * Manages subscriptions, usage-based billing, invoicing, and webhooks
 */
class StripeService {
  /**
   * Create or update a customer in Stripe
   */
  static async syncCustomer(user) {
    try {
      if (user.stripeCustomerId) {
        // Update existing customer
        await stripe.customers.update(user.stripeCustomerId, {
          email: user.email,
          name: user.name,
          metadata: {
            userId: user._id.toString(),
            teamId: user.teamId?.toString() || 'personal',
          },
        });
        return user.stripeCustomerId;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
          teamId: user.teamId?.toString() || 'personal',
        },
      });

      return customer.id;
    } catch (error) {
      logger.error('Failed to sync customer to Stripe:', error);
      throw error;
    }
  }

  /**
   * Get subscription plans (cached from Stripe)
   */
  static async getPlans() {
    try {
      const plans = await SubscriptionPlan.find({ active: true }).sort('price');
      return plans;
    } catch (error) {
      logger.error('Failed to fetch subscription plans:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a user
   */
  static async createSubscription(userId, priceId, paymentMethodId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!user) throw new Error('User not found');

      // Sync customer to Stripe
      const stripeCustomerId = await this.syncCustomer(user);

      // Get price details
      const price = await stripe.prices.retrieve(priceId);

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_method: paymentMethodId,
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to DB
      const dbSubscription = await Subscription.create({
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        stripeCustomerId,
        planName: price.product.name,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        autoRenew: subscription.automatic_tax?.enabled !== false,
      });

      // Update user subscription
      user.stripeCustomerId = stripeCustomerId;
      user.subscriptionId = dbSubscription._id;
      user.subscriptionTier = price.product.metadata?.tier || 'free';
      await user.save();

      return dbSubscription;
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription (change plan or payment method)
   */
  static async updateSubscription(subscriptionId, updates) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) throw new Error('Subscription not found');

      const stripeUpdate = {};

      if (updates.stripePriceId) {
        stripeUpdate.items = [
          {
            id: subscription.stripeSubscriptionId.items.data[0].id,
            price: updates.stripePriceId,
          },
        ];
      }

      if (updates.paymentMethodId) {
        stripeUpdate.default_payment_method = updates.paymentMethodId;
      }

      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        stripeUpdate
      );

      // Update DB
      subscription.stripePriceId = updates.stripePriceId || subscription.stripePriceId;
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      await subscription.save();

      return subscription;
    } catch (error) {
      logger.error('Failed to update subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId, immediate = false) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) throw new Error('Subscription not found');

      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: !immediate,
        }
      );

      subscription.status = stripeSubscription.status;
      subscription.canceledAt = new Date();
      subscription.autoRenew = false;
      await subscription.save();

      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Get current subscription usage
   */
  static async getUsage(subscriptionId) {
    try {
      const usage = await BillingUsage.findOne({ subscriptionId }).sort({ _id: -1 });
      return usage || { deployments: 0, bandwidth: 0, functions: 0 };
    } catch (error) {
      logger.error('Failed to get usage:', error);
      throw error;
    }
  }

  /**
   * Track usage event (deployments, bandwidth, functions)
   */
  static async trackUsage(subscriptionId, metric, amount = 1) {
    try {
      const usage = await BillingUsage.findOne({ subscriptionId }).sort({ _id: -1 });

      const newUsage = new BillingUsage({
        subscriptionId,
        deployments: usage?.deployments || 0,
        bandwidth: usage?.bandwidth || 0,
        functions: usage?.functions || 0,
        [metric]: (usage?.[metric] || 0) + amount,
      });

      await newUsage.save();

      // Check if usage exceeds limits and trigger warnings/overage charges
      await this.checkUsageLimits(subscriptionId, newUsage);

      return newUsage;
    } catch (error) {
      logger.error('Failed to track usage:', error);
      throw error;
    }
  }

  /**
   * Check usage limits and create overage charges
   */
  static async checkUsageLimits(subscriptionId, usage) {
    try {
      const subscription = await Subscription.findById(subscriptionId).populate('stripePriceId');
      const plan = await SubscriptionPlan.findOne({ stripePriceId: subscription.stripePriceId });

      if (!plan) return;

      const limits = plan.usageLimits;
      const overages = {};

      // Calculate overages
      if (limits.deployments && usage.deployments > limits.deployments) {
        overages.deployments = (usage.deployments - limits.deployments) * (plan.overagePricing?.deployments || 0.10);
      }

      if (limits.bandwidth && usage.bandwidth > limits.bandwidth) {
        overages.bandwidth = (usage.bandwidth - limits.bandwidth) * (plan.overagePricing?.bandwidth || 0.05);
      }

      if (limits.functions && usage.functions > limits.functions) {
        overages.functions = (usage.functions - limits.functions) * (plan.overagePricing?.functions || 0.01);
      }

      const totalOverage = Object.values(overages).reduce((a, b) => a + b, 0);

      if (totalOverage > 0) {
        // Create usage record with overage tracking
        await BillingUsage.updateOne(
          { _id: usage._id },
          { overageAmount: totalOverage, overageBreakdown: overages }
        );

        logger.info(`Usage overage for subscription ${subscriptionId}: $${totalOverage.toFixed(2)}`);
      }
    } catch (error) {
      logger.error('Failed to check usage limits:', error);
    }
  }

  /**
   * Get billing history (invoices)
   */
  static async getBillingHistory(stripeCustomerId, limit = 12) {
    try {
      const invoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit,
      });

      return invoices.data.map((invoice) => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000),
        amount: invoice.total / 100,
        currency: invoice.currency.toUpperCase(),
        status: invoice.status,
        pdfUrl: invoice.pdf,
        downloadUrl: invoice.invoice_pdf,
      }));
    } catch (error) {
      logger.error('Failed to get billing history:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaid(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoiceFailed(event.data.object);
          break;

        default:
          logger.debug(`Unhandled Stripe event: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Webhook handling failed:', error);
      throw error;
    }
  }

  /**
   * Handle subscription update events
   */
  static async handleSubscriptionUpdated(stripeSubscription) {
    try {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: stripeSubscription.id,
      });

      if (subscription) {
        subscription.status = stripeSubscription.status;
        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        await subscription.save();

        logger.info(`Subscription updated: ${stripeSubscription.id}`);
      }
    } catch (error) {
      logger.error('Failed to handle subscription update:', error);
    }
  }

  /**
   * Handle subscription cancellation
   */
  static async handleSubscriptionDeleted(stripeSubscription) {
    try {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: stripeSubscription.id,
      });

      if (subscription) {
        subscription.status = 'canceled';
        subscription.canceledAt = new Date();
        await subscription.save();

        logger.info(`Subscription canceled: ${stripeSubscription.id}`);
      }
    } catch (error) {
      logger.error('Failed to handle subscription cancellation:', error);
    }
  }

  /**
   * Handle successful invoice payment
   */
  static async handleInvoicePaid(invoice) {
    try {
      logger.info(`Invoice paid: ${invoice.id} for ${invoice.total / 100} ${invoice.currency.toUpperCase()}`);
      // Additional logic: send email, update analytics, etc.
    } catch (error) {
      logger.error('Failed to handle invoice payment:', error);
    }
  }

  /**
   * Handle failed invoice payment
   */
  static async handleInvoiceFailed(invoice) {
    try {
      logger.warn(`Invoice payment failed: ${invoice.id}`);
      // Send retry email, disable deployments, etc.
    } catch (error) {
      logger.error('Failed to handle invoice failure:', error);
    }
  }

  /**
   * Get customer portal session (for Stripe billing portal)
   */
  static async createBillingPortalSession(stripeCustomerId) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.CLIENT_URL}/billing`,
      });

      return session.url;
    } catch (error) {
      logger.error('Failed to create billing portal session:', error);
      throw error;
    }
  }

  /**
   * Create a checkout session (for new subscriptions)
   */
  static async createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!user) throw new Error('User not found');

      const stripeCustomerId = await this.syncCustomer(user);

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${process.env.CLIENT_URL}/billing?success=true`,
        cancel_url: cancelUrl || `${process.env.CLIENT_URL}/billing?canceled=true`,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create checkout session:', error);
      throw error;
    }
  }
}

module.exports = StripeService;
