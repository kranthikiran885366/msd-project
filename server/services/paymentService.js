const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  async getPaymentMethodsForUser(userId) {
    const paymentMethods = await PaymentMethod.getValidMethodsForUser(userId);
    return paymentMethods.map(method => this.formatPaymentMethod(method));
  }

  async addPaymentMethod(userId, paymentMethodData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create customer in Stripe if doesn't exist
    let stripeCustomer = user.stripeCustomerId;
    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: userId.toString() }
      });
      stripeCustomer = customer.id;
      await User.findByIdAndUpdate(userId, { stripeCustomerId: stripeCustomer });
    }

    // Create payment method in Stripe
    const stripePaymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: paymentMethodData.cardNumber,
        exp_month: parseInt(paymentMethodData.expiryMonth),
        exp_year: parseInt(`20${paymentMethodData.expiryYear}`),
        cvc: paymentMethodData.cvc
      },
      billing_details: {
        name: paymentMethodData.cardholderName,
        address: {
          line1: paymentMethodData.billingAddress,
          city: paymentMethodData.billingCity,
          state: paymentMethodData.billingState,
          postal_code: paymentMethodData.billingZip,
          country: paymentMethodData.billingCountry
        }
      }
    });

    // Attach to customer
    await stripe.paymentMethods.attach(stripePaymentMethod.id, {
      customer: stripeCustomer
    });

    // Save to database
    const paymentMethod = new PaymentMethod({
      userId,
      type: 'card',
      isDefault: paymentMethodData.setAsDefault || false,
      card: {
        brand: stripePaymentMethod.card.brand,
        last4: stripePaymentMethod.card.last4,
        expiryMonth: stripePaymentMethod.card.exp_month,
        expiryYear: stripePaymentMethod.card.exp_year,
        fingerprint: stripePaymentMethod.card.fingerprint,
        funding: stripePaymentMethod.card.funding,
        country: stripePaymentMethod.card.country
      },
      billingAddress: {
        name: paymentMethodData.cardholderName,
        line1: paymentMethodData.billingAddress,
        city: paymentMethodData.billingCity,
        state: paymentMethodData.billingState,
        postalCode: paymentMethodData.billingZip,
        country: paymentMethodData.billingCountry
      },
      processor: {
        name: 'stripe',
        customerId: stripeCustomer,
        paymentMethodId: stripePaymentMethod.id
      },
      status: 'verified'
    });

    await paymentMethod.save();
    return this.formatPaymentMethod(paymentMethod);
  }

  async deletePaymentMethod(methodId, userId) {
    const paymentMethod = await PaymentMethod.findOne({ _id: methodId, userId });
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Detach from Stripe
    if (paymentMethod.processor.paymentMethodId) {
      try {
        await stripe.paymentMethods.detach(paymentMethod.processor.paymentMethodId);
      } catch (error) {
        console.warn('Failed to detach payment method from Stripe:', error.message);
      }
    }

    await PaymentMethod.findByIdAndDelete(methodId);
    return true;
  }

  async setDefaultPaymentMethod(methodId, userId) {
    const paymentMethod = await PaymentMethod.findOne({ _id: methodId, userId });
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    await paymentMethod.markAsDefault();
    return this.formatPaymentMethod(paymentMethod);
  }

  async processPayment(userId, amount, paymentMethodId, description) {
    const paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, userId });
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: paymentMethod.processor.customerId,
        payment_method: paymentMethod.processor.paymentMethodId,
        description,
        confirm: true,
        return_url: `${process.env.CLIENT_URL}/billing/payment-success`
      });

      // Record successful payment
      await paymentMethod.recordSuccess();

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      };
    } catch (error) {
      // Record failed payment
      await paymentMethod.recordFailure();
      
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  async createSetupIntent(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create customer in Stripe if doesn't exist
    let stripeCustomer = user.stripeCustomerId;
    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: userId.toString() }
      });
      stripeCustomer = customer.id;
      await User.findByIdAndUpdate(userId, { stripeCustomerId: stripeCustomer });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomer,
      payment_method_types: ['card'],
      usage: 'off_session'
    });

    return {
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomer
    };
  }

  async validatePaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      return paymentMethod.card && !paymentMethod.card.expired;
    } catch (error) {
      return false;
    }
  }

  formatPaymentMethod(paymentMethod) {
    return {
      id: paymentMethod._id,
      type: paymentMethod.type,
      isDefault: paymentMethod.isDefault,
      brand: paymentMethod.card?.brand,
      lastFourDigits: paymentMethod.card?.last4,
      expiryMonth: paymentMethod.card?.expiryMonth,
      expiryYear: paymentMethod.card?.expiryYear,
      cardholderName: paymentMethod.billingAddress?.name,
      billingAddress: paymentMethod.billingAddress?.line1,
      billingCity: paymentMethod.billingAddress?.city,
      billingState: paymentMethod.billingAddress?.state,
      billingZip: paymentMethod.billingAddress?.postalCode,
      billingCountry: paymentMethod.billingAddress?.country,
      status: paymentMethod.status,
      lastUsedAt: paymentMethod.lastUsedAt,
      createdAt: paymentMethod.createdAt
    };
  }

  async getPaymentHistory(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    // This would typically come from Stripe or your payment records
    // For now, we'll return a mock implementation
    return {
      payments: [],
      total: 0,
      hasMore: false
    };
  }

  async refundPayment(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
    } catch (error) {
      throw new Error(`Refund failed: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();