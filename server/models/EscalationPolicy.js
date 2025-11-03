const mongoose = require('mongoose');

const escalationRuleSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true
  },
  delayMinutes: {
    type: Number,
    required: true,
    default: 0
  },
  assignedTo: {
    type: String,
    enum: ['user', 'team', 'on-call', 'manager', 'director'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  contact: String,
  notificationMethods: [{
    type: String,
    enum: ['email', 'sms', 'call', 'slack', 'webhook']
  }]
});

const escalationPolicySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    required: true,
    index: true
  },
  enabled: {
    type: Boolean,
    default: true,
    index: true
  },
  escalationRules: [escalationRuleSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastTriggered: Date,
  triggerCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

escalationPolicySchema.index({ projectId: 1, enabled: 1 });
escalationPolicySchema.index({ projectId: 1, severity: 1 });

module.exports = mongoose.model('EscalationPolicy', escalationPolicySchema);