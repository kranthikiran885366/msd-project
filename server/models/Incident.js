const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  deploymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in-progress', 'resolved'],
    default: 'pending',
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    required: true,
    index: true
  },
  component: {
    type: String,
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolution: String,
  detectedBy: {
    type: String,
    enum: ['manual', 'alert', 'monitoring', 'deployment'],
    default: 'manual'
  },
  timeline: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    event: String,
    detail: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

incidentSchema.index({ projectId: 1, status: 1 });
incidentSchema.index({ projectId: 1, severity: 1 });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ assignee: 1, status: 1 });

module.exports = mongoose.model('Incident', incidentSchema);