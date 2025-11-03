// Serverless Function Model
const mongoose = require("mongoose")

const executionLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  duration: Number,
  status: { type: String, enum: ["success", "error", "timeout"], default: "success" },
  input: mongoose.Schema.Types.Mixed,
  output: mongoose.Schema.Types.Mixed,
  error: String,
  coldStart: { type: Boolean, default: false },
  memoryUsed: Number,
  cpuUsed: Number,
})

const functionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    description: String,
    runtime: {
      type: String,
      enum: ["node18", "node20", "python39", "python311", "go1.21", "ruby3.2"],
      default: "node20",
    },
    handler: String,
    code: String,
    environment: {
      type: Map,
      of: String,
    },
    memory: {
      type: Number,
      enum: [128, 256, 512, 1024, 2048],
      default: 256,
    },
    timeout: {
      type: Number,
      default: 30,
      max: 900,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    isEdgeFunction: {
      type: Boolean,
      default: false,
    },
    regions: [String],
    triggers: [{
      type: String,
      enum: ["http", "webhook", "cron", "event"],
    }],
    cronExpression: String,
    webhookUrl: String,
    lastRunAt: Date,
    lastStatus: {
      type: String,
      enum: ["success", "error", "timeout", "never-run"],
      default: "never-run",
    },
    invocations: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    averageExecutionTime: { type: Number, default: 0 },
    executionLogs: [executionLogSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
)

// Indexes
functionSchema.index({ projectId: 1, name: 1 })
functionSchema.index({ enabled: 1 })
functionSchema.index({ lastRunAt: -1 })

module.exports = mongoose.model("Function", functionSchema)
