// Environment Variables Model
const mongoose = require("mongoose")

const environmentSchema = new mongoose.Schema(
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
    value: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      enum: ["dev", "staging", "prod"],
      default: "prod",
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Environment", environmentSchema)
