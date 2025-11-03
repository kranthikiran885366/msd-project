const mongoose = require("mongoose")

const envVarSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    scope: {
      type: String,
      enum: ["development", "staging", "production", "all"],
      default: "all",
    },
  },
  { timestamps: true }
)

envVarSchema.index({ projectId: 1, key: 1 })
envVarSchema.index({ projectId: 1, scope: 1 })

module.exports = mongoose.model("EnvironmentVar", envVarSchema)
