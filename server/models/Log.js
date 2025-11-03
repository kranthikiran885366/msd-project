// Application Logs Model
const mongoose = require("mongoose")

const logSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    deploymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deployment",
    },
    service: String,
    level: {
      type: String,
      enum: ["debug", "info", "warn", "error", "fatal"],
      default: "info",
    },
    message: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
)

logSchema.index({ createdAt: -1 })
logSchema.index({ projectId: 1, createdAt: -1 })

module.exports = mongoose.model("Log", logSchema)
