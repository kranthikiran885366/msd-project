// Billing Model
const mongoose = require("mongoose")

const billingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["hobby", "pro", "scale"],
      default: "hobby",
    },
    paymentMethod: {
      brand: String,
      last4: String,
      expiryMonth: Number,
      expiryYear: Number,
    },
    usage: {
      bandwidthGb: Number,
      functionsMs: Number,
      storageGb: Number,
      deployments: Number,
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    status: {
      type: String,
      enum: ["active", "past_due", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Billing", billingSchema)
