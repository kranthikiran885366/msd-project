const mongoose = require("mongoose")
const { Schema } = mongoose

const permissionSchema = new Schema({
  resource: { type: String, required: true, enum: ["projects", "builds", "functions", "databases", "team", "analytics", "settings"] },
  actions: [{ type: String, enum: ["create", "read", "update", "delete", "execute", "deploy"] }],
  description: String,
})

const roleSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    name: { type: String, required: true },
    description: String,
    permissions: [permissionSchema],
    userCount: { type: Number, default: 0 },
    isCustom: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

roleSchema.index({ projectId: 1, name: 1 }, { unique: true })
roleSchema.index({ projectId: 1, isActive: 1 })

module.exports = mongoose.model("Role", roleSchema)
