/**
 * Stripe utility module
 * Initializes and exports Stripe client instance
 */

const Stripe = require('stripe');

// Initialize Stripe with API key from environment
const stripeApiKey = process.env.STRIPE_SECRET_KEY;

if (!stripeApiKey) {
  console.warn('Warning: STRIPE_SECRET_KEY environment variable is not set. Stripe operations will fail.');
}

// Create Stripe instance
const stripe = stripeApiKey ? new Stripe(stripeApiKey) : createMockStripeClient();

/**
 * Create a mock Stripe client for development/testing
 * This prevents errors when STRIPE_SECRET_KEY is not configured
 */
function createMockStripeClient() {
  return {
    subscriptions: {
      create: async (params) => {
        console.warn('Mock Stripe: subscriptions.create called (no Stripe API key configured)');
        return {
          id: `sub_mock_${Date.now()}`,
          customer: params.customer,
          items: { data: params.items || [] },
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          latest_invoice: params.expand?.includes('latest_invoice.payment_intent') ? {
            payment_intent: { id: `pi_mock_${Date.now()}` }
          } : null,
        };
      },
      update: async (subscriptionId, params) => {
        console.warn(`Mock Stripe: subscriptions.update called for ${subscriptionId}`);
        return {
          id: subscriptionId,
          items: { data: params.items || [] },
        };
      },
      del: async (subscriptionId, params) => {
        console.warn(`Mock Stripe: subscriptions.del called for ${subscriptionId}`);
        return { id: subscriptionId, status: 'canceled' };
      },
      retrieve: async (subscriptionId) => {
        console.warn(`Mock Stripe: subscriptions.retrieve called for ${subscriptionId}`);
        return {
          id: subscriptionId,
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        };
      },
    },
    customers: {
      create: async (params) => {
        console.warn('Mock Stripe: customers.create called');
        return {
          id: `cus_mock_${Date.now()}`,
          email: params.email,
          metadata: params.metadata || {},
        };
      },
      update: async (customerId, params) => {
        console.warn(`Mock Stripe: customers.update called for ${customerId}`);
        return {
          id: customerId,
          metadata: params.metadata || {},
        };
      },
      retrieve: async (customerId) => {
        console.warn(`Mock Stripe: customers.retrieve called for ${customerId}`);
        return {
          id: customerId,
          email: 'user@example.com',
        };
      },
    },
    paymentMethods: {
      create: async (params) => {
        console.warn('Mock Stripe: paymentMethods.create called');
        return {
          id: `pm_mock_${Date.now()}`,
          type: params.type,
          billing_details: params.billing_details || {},
        };
      },
      attach: async (paymentMethodId, params) => {
        console.warn(`Mock Stripe: paymentMethods.attach called for ${paymentMethodId}`);
        return { id: paymentMethodId, customer: params.customer };
      },
      detach: async (paymentMethodId) => {
        console.warn(`Mock Stripe: paymentMethods.detach called for ${paymentMethodId}`);
        return { id: paymentMethodId };
      },
    },
    invoices: {
      create: async (params) => {
        console.warn('Mock Stripe: invoices.create called');
        return {
          id: `in_mock_${Date.now()}`,
          customer: params.customer,
          subscription: params.subscription,
          amount_due: params.amount_due || 0,
          status: 'draft',
        };
      },
      retrieve: async (invoiceId) => {
        console.warn(`Mock Stripe: invoices.retrieve called for ${invoiceId}`);
        return {
          id: invoiceId,
          status: 'paid',
          amount_due: 0,
        };
      },
      list: async (params) => {
        console.warn('Mock Stripe: invoices.list called');
        return { data: [] };
      },
    },
    prices: {
      retrieve: async (priceId) => {
        console.warn(`Mock Stripe: prices.retrieve called for ${priceId}`);
        return {
          id: priceId,
          amount: 9999,
          currency: 'usd',
          recurring: { interval: 'month' },
        };
      },
    },
    webhookEndpoints: {
      create: async (params) => {
        console.warn('Mock Stripe: webhookEndpoints.create called');
        return {
          id: `we_mock_${Date.now()}`,
          url: params.url,
          enabled_events: params.enabled_events || [],
        };
      },
    },
  };
}

module.exports = {
  stripe,
  Stripe,
};
