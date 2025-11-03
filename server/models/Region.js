const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  provider: {
    type: String,
    enum: ['aws', 'gcp', 'azure'],
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  configuration: {
    instanceType: String,
    scalingMin: {
      type: Number,
      min: 1,
      default: 1,
    },
    scalingMax: {
      type: Number,
      min: 1,
      default: 5,
    },
    backupEnabled: {
      type: Boolean,
      default: true,
    },
    monitoring: {
      type: Boolean,
      default: true,
    },
  },
  traffic: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lastUpdated: Date,
  },
  health: {
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'unhealthy'],
      default: 'healthy',
    },
    lastCheck: Date,
    metrics: {
      cpuUsage: Number,
      memoryUsage: Number,
      latency: Number,
      errorRate: Number,
    },
  },
  deployments: [{
    deploymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deployment',
    },
    version: String,
    status: {
      type: String,
      enum: ['pending', 'deploying', 'running', 'failed'],
      default: 'pending',
    },
    deployedAt: Date,
    logs: [{
      timestamp: Date,
      level: String,
      message: String,
    }],
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

regionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

regionSchema.methods.updateHealth = async function(metrics) {
  this.health.lastCheck = new Date();
  this.health.metrics = metrics;

  // Calculate health status based on metrics
  if (metrics.errorRate > 10 || metrics.latency > 1000) {
    this.health.status = 'unhealthy';
  } else if (metrics.errorRate > 5 || metrics.latency > 500) {
    this.health.status = 'degraded';
  } else {
    this.health.status = 'healthy';
  }

  return this.save();
};

regionSchema.methods.updateTraffic = async function(percentage) {
  this.traffic.percentage = percentage;
  this.traffic.lastUpdated = new Date();
  return this.save();
};

regionSchema.methods.addDeployment = async function(deploymentId, version) {
  this.deployments.unshift({
    deploymentId,
    version,
    status: 'deploying',
    deployedAt: new Date(),
  });
  return this.save();
};

regionSchema.methods.updateDeploymentStatus = async function(deploymentId, status, log) {
  const deployment = this.deployments.find(d => d.deploymentId.equals(deploymentId));
  if (deployment) {
    deployment.status = status;
    if (log) {
      deployment.logs.push({
        timestamp: new Date(),
        level: log.level || 'info',
        message: log.message,
      });
    }
    return this.save();
  }
};

module.exports = mongoose.model('Region', regionSchema);