const mongoose = require("mongoose")
const { Schema } = mongoose

const accessControlSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    resource: { type: String, required: true },
    grantedAt: { type: Date, default: Date.now },
    grantedBy: { type: Schema.Types.ObjectId, ref: "User" },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

accessControlSchema.index({ projectId: 1, userId: 1 })
accessControlSchema.index({ projectId: 1, roleId: 1 })
accessControlSchema.index({ expiresAt: 1 }, { sparse: true })

module.exports = mongoose.models.AccessControl || mongoose.model("AccessControl", accessControlSchema)
