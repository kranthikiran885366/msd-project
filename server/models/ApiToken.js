const mongoose = require("mongoose")
const { Schema } = mongoose

const apiTokenSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    prefix: { type: String, required: true },
    scopes: [String],
    lastUsedAt: Date,
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

apiTokenSchema.index({ projectId: 1, prefix: 1 })
apiTokenSchema.index({ expiresAt: 1 }, { sparse: true })

module.exports = mongoose.models.ApiToken || mongoose.model("ApiToken", apiTokenSchema)
