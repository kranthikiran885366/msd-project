// Domain Redirect Model
const mongoose = require("mongoose")

const domainRedirectSchema = new mongoose.Schema(
  {
    domainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
      required: true,
    },
    sourceUrl: {
      type: String,
      required: true,
    },
    destinationUrl: {
      type: String,
      required: true,
    },
    redirectType: {
      type: String,
      enum: ["301", "302", "307", "308"],
      default: "301",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    hits: {
      type: Number,
      default: 0,
    },
    lastHit: Date,
  },
  { timestamps: true }
)

// Indexes
domainRedirectSchema.index({ domainId: 1 })
domainRedirectSchema.index({ sourceUrl: 1 })
domainRedirectSchema.index({ enabled: 1 })

module.exports = mongoose.model("DomainRedirect", domainRedirectSchema)