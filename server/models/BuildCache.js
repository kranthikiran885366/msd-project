// Build Cache Model - new model for caching layers
const mongoose = require("mongoose")

const buildCacheSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    framework: String,
    cacheKey: String,
    cacheSize: Number,
    dependencies: [String],
    buildSteps: [String],
    lastUsedAt: Date,
    hitCount: { type: Number, default: 0 },
    expiresAt: Date,
  },
  { timestamps: true },
)

buildCacheSchema.index({ projectId: 1, cacheKey: 1 })
buildCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model("BuildCache", buildCacheSchema)
