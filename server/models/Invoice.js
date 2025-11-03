const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ['subscription', 'overage', 'addon', 'discount', 'tax'],
    default: 'subscription'
  },
  metadata: {
    planId: mongoose.Schema.Types.ObjectId,
    usageType: String,
    period: {
      start: Date,
      end: Date
    }
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  billingPeriod: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  tax: {
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  discount: {
    code: String,
    amount: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  dueDate: { type: Date, required: true },
  paidAt: Date,
  paymentMethod: {
    id: String,
    type: String,
    last4: String,
    brand: String
  },
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
  notes: String,
  metadata: {
    stripeInvoiceId: String,
    paymentIntentId: String,
    attemptCount: { type: Number, default: 0 },
    nextRetryAt: Date
  }
}, {
  timestamps: true
});

// Generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
        $lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    });
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate totals
invoiceSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.tax.amount = this.subtotal * (this.tax.rate / 100);
  this.total = this.subtotal + this.tax.amount - this.discount.amount;
  return this;
};

// Mark as paid
invoiceSchema.methods.markAsPaid = function(paymentMethod) {
  this.status = 'paid';
  this.paidAt = new Date();
  if (paymentMethod) {
    this.paymentMethod = paymentMethod;
  }
  return this.save();
};

// Mark as failed
invoiceSchema.methods.markAsFailed = function() {
  this.status = 'failed';
  this.metadata.attemptCount += 1;
  // Set next retry date (exponential backoff)
  const retryDelay = Math.pow(2, this.metadata.attemptCount) * 24 * 60 * 60 * 1000; // days in ms
  this.metadata.nextRetryAt = new Date(Date.now() + retryDelay);
  return this.save();
};

// Indexes
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ subscriptionId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);