const mongoose = require('mongoose');

const billingContactSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  preferences: {
    invoiceEmails: {
      type: Boolean,
      default: true
    },
    paymentReminders: {
      type: Boolean,
      default: true
    },
    usageAlerts: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

billingContactSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure only one primary contact per organization
billingContactSchema.pre('save', async function(next) {
  if (this.isPrimary) {
    await this.constructor.updateMany(
      { 
        organizationId: this.organizationId,
        _id: { $ne: this._id }
      },
      { isPrimary: false }
    );
  }
  next();
});

module.exports = mongoose.model('BillingContact', billingContactSchema);