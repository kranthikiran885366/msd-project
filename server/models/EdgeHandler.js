const mongoose = require('mongoose');

const edgeHandlerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  pattern: {
    type: String,
    required: true,
    default: '/*',
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['request', 'response', 'middleware'],
    default: 'request',
  },
  regions: [{
    type: String,
    enum: ['all', 'us-east', 'us-west', 'eu-central', 'ap-south'],
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'error'],
    default: 'draft',
  },
  version: {
    type: Number,
    default: 1,
  },
  deployedAt: Date,
  lastTestedAt: Date,
  testResults: [{
    timestamp: Date,
    success: Boolean,
    response: mongoose.Schema.Types.Mixed,
    error: String,
    performance: {
      responseTime: Number,
      coldStart: Number,
      memory: Number,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

edgeHandlerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

edgeHandlerSchema.methods.deploy = async function() {
  this.status = 'active';
  this.deployedAt = new Date();
  this.version += 1;
  return this.save();
};

edgeHandlerSchema.methods.recordTest = async function(result) {
  this.lastTestedAt = new Date();
  this.testResults.push({
    timestamp: new Date(),
    ...result,
  });
  return this.save();
};

module.exports = mongoose.model('EdgeHandler', edgeHandlerSchema);