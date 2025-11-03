const mongoose = require('mongoose');

const NotificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  channels: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    webhook: { type: Boolean, default: false }
  },
  notificationTypes: {
    deployments: { type: Boolean, default: true },
    buildFailures: { type: Boolean, default: true },
    alerts: { type: Boolean, default: true },
    billing: { type: Boolean, default: true },
    teamInvitations: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    updates: { type: Boolean, default: false },
    comments: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true }
  },
  frequency: {
    type: String,
    enum: ['immediate', 'hourly', 'daily', 'weekly', 'off'],
    default: 'immediate'
  },
  emailAddress: {
    type: String,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  webhookUrl: {
    type: String,
    trim: true
  },
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true
  },
  quiet: {
    enabled: { type: Boolean, default: false },
    startTime: String, // HH:mm format
    endTime: String // HH:mm format
  },
  preferences: {
    groupByProject: { type: Boolean, default: true },
    digestEnabled: { type: Boolean, default: false },
    digestTime: String // HH:mm format
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

NotificationPreferenceSchema.pre('save', async function(next) {
  if (!this.unsubscribeToken) {
    const crypto = require('crypto');
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);
