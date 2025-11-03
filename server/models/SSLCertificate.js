// SSL Certificate Model
const mongoose = require("mongoose")

const sslCertificateSchema = new mongoose.Schema(
  {
    domainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      required: true,
    },
    issuer: {
      type: String,
      default: "Let's Encrypt",
    },
    status: {
      type: String,
      enum: ["active", "expiring_soon", "expired", "pending"],
      default: "pending",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    fingerprint: String,
    autoRenew: {
      type: Boolean,
      default: true,
    },
    certificateChain: String,
    certificateData: String,
    privateKey: String,
  },
  { timestamps: true }
)

// Virtual for days until expiry
sslCertificateSchema.virtual("daysUntilExpiry").get(function () {
  const now = new Date()
  const expiry = new Date(this.expiresAt)
  const diffTime = expiry - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// Indexes
sslCertificateSchema.index({ domainId: 1 })
sslCertificateSchema.index({ expiresAt: 1 })
sslCertificateSchema.index({ status: 1 })

module.exports = mongoose.model("SSLCertificate", sslCertificateSchema)