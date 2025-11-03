const mongoose = require('mongoose')

const buildHookSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['pre-build', 'post-build', 'pre-deploy', 'post-deploy'],
    required: true,
  },
  command: String,
  timeout: { type: Number, default: 300 },
})

const buildStepSchema = new mongoose.Schema({
  name: String,
  command: String,
  duration: Number,
  status: { type: String, enum: ['pending', 'running', 'success', 'failed'], default: 'pending' },
  logs: [String],
  startedAt: Date,
  completedAt: Date,
})

const buildSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    deploymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment' },
    status: { type: String, enum: ['queued', 'running', 'success', 'failed', 'canceled', 'pending'], default: 'queued' },
    trigger: {
      type: String,
      enum: ['git-push', 'manual', 'webhook', 'scheduled', 'rollback'],
      default: 'manual',
    },
    commit: String,
    branch: String,
    author: String,
    message: String,
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        line: String,
        level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
      },
    ],
    steps: [buildStepSchema],
    hooks: [buildHookSchema],
    cacheKey: String,
    cacheHit: { type: Boolean, default: false },
    artifacts: [
      {
        path: String,
        size: Number,
        url: String,
      },
    ],
    duration: Number,
    exitCode: Number,
    environment: {
      framework: String,
      nodeVersion: String,
      buildImage: String,
      customEnvVars: [{
        key: String,
        value: String,
      }],
    },
    buildImage: String,
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    notifications: {
      slack: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      webhook: { type: Boolean, default: false },
    },
    metrics: {
      cacheHitRate: { type: Number, default: 0 },
      buildSize: Number,
      artifactSize: Number,
      peakMemoryUsage: Number,
      peakCpuUsage: Number,
    },
  },
  { timestamps: true },
)

buildSchema.index({ projectId: 1, createdAt: -1 })
buildSchema.index({ status: 1 })
buildSchema.index({ branch: 1 })
buildSchema.index({ cacheKey: 1 })

module.exports = mongoose.model('Build', buildSchema)
