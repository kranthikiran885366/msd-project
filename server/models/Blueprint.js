const mongoose = require("mongoose")

const resourceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  region: String,
  settings: mongoose.Schema.Types.Mixed,
})

const blueprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  type: {
    type: String,
    enum: ["application", "database", "storage", "network"],
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  config: {
    resources: [resourceSchema],
    environment: {
      type: Map,
      of: String,
    },
    scaling: {
      min: Number,
      max: Number,
      target: String,
    },
    networking: {
      vpc: String,
      subnets: [String],
      securityGroups: [String],
    },
  },
  metadata: {
    creator: String,
    version: String,
    tags: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
})

blueprintSchema.pre("save", function(next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("Blueprint", blueprintSchema)