const mongoose = require("mongoose")

const webhookSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    events: [String],
    secret: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastDelivery: Date,
    deliveryStats: {
      total: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      failureRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

webhookSchema.index({ projectId: 1, active: 1 })
webhookSchema.index({ url: 1 })

module.exports = mongoose.models.Webhook || mongoose.model("Webhook", webhookSchema)
