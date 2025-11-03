const mongoose = require("mongoose")

const isrPageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  revalidateSeconds: {
    type: Number,
    min: 1,
    default: 60,
  },
  onDemand: {
    type: Boolean,
    default: false,
  },
  fallback: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["active", "paused"],
    default: "active",
  },
  lastRevalidated: Date,
  revalidationHistory: [{
    timestamp: Date,
    trigger: {
      type: String,
      enum: ["automatic", "manual", "webhook"],
    },
    success: Boolean,
    error: String,
  }],
  analytics: {
    totalRevalidations: {
      type: Number,
      default: 0,
    },
    averageRevalidationTime: Number,
    failureRate: Number,
    lastFailure: Date,
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

isrPageSchema.pre("save", function(next) {
  this.updatedAt = Date.now()
  next()
})

isrPageSchema.methods.updateAnalytics = function() {
  const history = this.revalidationHistory || []
  const totalRevalidations = history.length
  
  if (totalRevalidations === 0) return

  // Calculate failure rate
  const failures = history.filter(h => !h.success).length
  this.analytics.failureRate = (failures / totalRevalidations) * 100

  // Update last failure if any
  const lastFailure = history.reverse().find(h => !h.success)
  if (lastFailure) {
    this.analytics.lastFailure = lastFailure.timestamp
  }

  // Calculate average revalidation time (if we had timing info)
  // This would require additional instrumentation
}

module.exports = mongoose.model("ISRPage", isrPageSchema)