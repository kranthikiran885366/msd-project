// Cron Job Model
const mongoose = require("mongoose")

const cronJobSchema = new mongoose.Schema(
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
    schedule: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastRunAt: Date,
    lastRunStatus: {
      type: String,
      enum: ["success", "failed"],
    },
    nextRunAt: Date,
    failureCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("CronJob", cronJobSchema)
