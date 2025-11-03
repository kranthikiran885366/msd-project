const mongoose = require("mongoose")

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  }
})

const splitTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  variants: [variantSchema],
  status: {
    type: String,
    enum: ["active", "paused", "completed"],
    default: "active",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: Date,
  metrics: {
    totalVisitors: {
      type: Number,
      default: 0,
    },
    variantMetrics: [{
      variantName: String,
      visitors: Number,
      conversions: Number,
      conversionRate: Number,
    }],
  },
  conditions: {
    targetUrl: String,
    deviceTypes: [String],
    userSegments: [String],
    customRules: mongoose.Schema.Types.Mixed,
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

splitTestSchema.pre("save", function(next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("SplitTest", splitTestSchema)