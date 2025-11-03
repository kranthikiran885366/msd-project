// Database Model - Enhanced
const mongoose = require("mongoose")
const { Schema } = mongoose

const backupSchema = new Schema(
  {
    name: { type: String, required: true },
    size: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    backupAt: Date,
    restoreAt: Date,
    retentionDays: { type: Number, default: 30 },
    isAutomatic: { type: Boolean, default: false },
    storageLocation: String,
  },
  { timestamps: true }
)

const databaseSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["postgresql", "mysql", "mongodb", "redis", "mariadb"],
      required: true,
    },
    name: { type: String, required: true },
    displayName: String,
    size: {
      type: String,
      enum: ["micro", "small", "medium", "large", "xlarge"],
      default: "small",
    },
    region: {
      type: String,
      enum: ["iad1", "fra1", "sfo1", "sin1"],
      default: "iad1",
    },
    connectionString: String,
    host: String,
    port: Number,
    database: String,
    username: String,
    password: String,
    status: {
      type: String,
      enum: ["creating", "running", "paused", "deleted"],
      default: "running",
      index: true,
    },
    backupEnabled: {
      type: Boolean,
      default: true,
    },
    backupSchedule: { type: String, default: "daily" },
    backups: [backupSchema],
    sslEnabled: { type: Boolean, default: false },
    isProvisioned: { type: Boolean, default: false },
    createdBy: Schema.Types.ObjectId,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

databaseSchema.index({ projectId: 1, type: 1 })
databaseSchema.index({ projectId: 1, status: 1 })

module.exports = mongoose.model("Database", databaseSchema)
