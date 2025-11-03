const mongoose = require("mongoose")

const alertSchema = new mongoose.Schema(
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
    metricType: {
      type: String,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    operator: {
      type: String,
      enum: ["gt", "gte", "lt", "lte", "eq", "ne"],
      required: true,
    },
    message: {
      type: String,
    },
    channels: [
      {
        type: String,
        enum: ["email", "webhook", "slack", "pagerduty"],
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: Date,
    resolvedAt: Date,
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastTriggered: Date,
    triggerCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

alertSchema.index({ projectId: 1, active: 1 })
alertSchema.index({ metricType: 1 })

module.exports = mongoose.models.Alert || mongoose.model("Alert", alertSchema)
