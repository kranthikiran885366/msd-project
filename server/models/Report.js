const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['incident', 'sla', 'metrics', 'trend', 'alert'],
    required: true,
    index: true
  },
  timeRange: {
    type: String,
    enum: ['7d', '30d', '90d', '365d'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  format: {
    type: String,
    enum: ['json', 'pdf', 'csv'],
    default: 'json'
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'completed'
  }
}, { timestamps: true });

reportSchema.index({ projectId: 1, type: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ generatedBy: 1 });

module.exports = mongoose.model('Report', reportSchema);