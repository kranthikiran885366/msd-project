// Deployment Analytics Model - new model for tracking metrics
const mongoose = require("mongoose")

const analyticsSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    deploymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deployment",
    },
    metricType: {
      type: String,
      enum: ["response_time", "error_rate", "memory_usage", "cpu_usage", "bandwidth"],
    },
    value: Number,
    timestamp: { type: Date, default: Date.now },
    region: String,
    environment: String,
  },
  { timestamps: true },
)

analyticsSchema.index({ projectId: 1, timestamp: -1 })
analyticsSchema.index({ deploymentId: 1 })

module.exports = mongoose.model("DeploymentAnalytics", analyticsSchema)
