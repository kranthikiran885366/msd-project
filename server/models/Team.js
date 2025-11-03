// Team Member Model - Enhanced
const mongoose = require("mongoose")
const { Schema } = mongoose

const activityLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  resourceType: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  timestamp: { type: Date, default: Date.now },
})

const teamSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "developer", "viewer"],
      default: "developer",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: Date,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    permissions: [
      {
        resource: String,
        actions: [String],
      },
    ],
    activityLogs: [activityLogSchema],
    lastActivityAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

teamSchema.index({ projectId: 1, status: 1 })
teamSchema.index({ projectId: 1, userId: 1 })
teamSchema.index({ projectId: 1, createdAt: -1 })

module.exports = mongoose.model("Team", teamSchema)
