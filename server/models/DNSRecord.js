// DNS Record Model
const mongoose = require("mongoose")

const dnsRecordSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"],
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    ttl: {
      type: Number,
      default: 3600,
    },
    priority: {
      type: Number,
      default: 10,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Indexes
dnsRecordSchema.index({ domainId: 1, type: 1 })
dnsRecordSchema.index({ name: 1, type: 1 })

module.exports = mongoose.model("DNSRecord", dnsRecordSchema)