const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['card', 'bank_account', 'paypal', 'wire_transfer'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  // Card details (encrypted/tokenized)
  card: {
    brand: String, // visa, mastercard, amex, etc.
    last4: String,
    expiryMonth: Number,
    expiryYear: Number,
    fingerprint: String, // Unique identifier for the card
    funding: String, // credit, debit, prepaid
    country: String
  },
  // Bank account details (encrypted/tokenized)
  bankAccount: {
    routingNumber: String,
    last4: String,
    accountType: String, // checking, savings
    bankName: String,
    country: String
  },
  // Billing address
  billingAddress: {
    name: String,
    company: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  // Payment processor details
  processor: {
    name: {
      type: String,
      enum: ['stripe', 'paypal', 'square'],
      default: 'stripe'
    },
    customerId: String, // Customer ID in payment processor
    paymentMethodId: String, // Payment method ID in payment processor
    setupIntentId: String // For 3D Secure verification
  },
  // Status and verification
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'expired'],
    default: 'pending'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  // Usage tracking
  lastUsedAt: Date,
  failureCount: {
    type: Number,
    default: 0
  },
  // Metadata
  metadata: {
    addedVia: String, // web, mobile, api
    ipAddress: String,
    userAgent: String,
    fingerprint: String
  }
}, {
  timestamps: true
});

// Ensure only one default payment method per user
paymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default flag from other payment methods for this user
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Instance methods
paymentMethodSchema.methods.markAsDefault = async function() {
  // Remove default flag from other payment methods
  await this.constructor.updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { $set: { isDefault: false } }
  );
  
  this.isDefault = true;
  return this.save();
};

paymentMethodSchema.methods.recordFailure = function() {
  this.failureCount += 1;
  if (this.failureCount >= 3) {
    this.status = 'failed';
  }
  return this.save();
};

paymentMethodSchema.methods.recordSuccess = function() {
  this.lastUsedAt = new Date();
  this.failureCount = 0;
  this.status = 'verified';
  return this.save();
};

paymentMethodSchema.methods.isExpired = function() {
  if (this.type === 'card' && this.card) {
    const now = new Date();
    const expiry = new Date(this.card.expiryYear, this.card.expiryMonth - 1);
    return now > expiry;
  }
  return false;
};

// Static methods
paymentMethodSchema.statics.getDefaultForUser = function(userId) {
  return this.findOne({ userId, isDefault: true, status: 'verified' });
};

paymentMethodSchema.statics.getValidMethodsForUser = function(userId) {
  return this.find({
    userId,
    status: { $in: ['verified', 'pending'] }
  }).sort({ isDefault: -1, createdAt: -1 });
};

// Virtual for display name
paymentMethodSchema.virtual('displayName').get(function() {
  if (this.type === 'card' && this.card) {
    return `${this.card.brand.toUpperCase()} •••• ${this.card.last4}`;
  } else if (this.type === 'bank_account' && this.bankAccount) {
    return `${this.bankAccount.bankName} •••• ${this.bankAccount.last4}`;
  }
  return this.type.replace('_', ' ').toUpperCase();
});

// Indexes
paymentMethodSchema.index({ userId: 1, isDefault: -1 });
paymentMethodSchema.index({ userId: 1, status: 1 });
paymentMethodSchema.index({ 'processor.customerId': 1 });
paymentMethodSchema.index({ 'processor.paymentMethodId': 1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);