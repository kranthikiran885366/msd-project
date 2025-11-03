// Domain Model
const mongoose = require("mongoose")

const domainSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    host: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
    dnsRecords: [
      {
        type: {
          type: String,
          enum: ["A", "AAAA", "CNAME", "TXT", "MX", "NS"],
        },
        host: String,
        value: String,
        ttl: {
          type: Number,
          default: 3600,
        },
      },
    ],
    sslCertificate: {
      issued: Date,
      expires: Date,
      provider: String,
    },
    certificateStatus: {
      type: String,
      enum: ["pending", "active", "expired"],
      default: "pending",
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Domain", domainSchema)
