// Deployment Model
const mongoose = require("mongoose")

const deploymentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    version: String,
    status: {
      type: String,
      enum: ["pending", "building", "deploying", "running", "failed", "rolled-back"],
      default: "pending",
    },
    buildTime: Number,
    deployTime: Number,
    buildCacheHitRate: { type: Number, default: 0 },
    buildSize: Number,
    deploymentSize: Number,
    previewUrl: String,
    productionUrl: String,
    gitCommit: String,
    gitBranch: String,
    gitAuthor: String,
    commitMessage: String,
    logs: [
      {
        timestamp: Date,
        message: String,
        level: {
          type: String,
          enum: ["info", "warn", "error"],
          default: "info",
        },
      },
    ],
    buildSteps: [
      {
        name: String,
        duration: Number,
        status: { type: String, enum: ["success", "failed"] },
      },
    ],
    environment: {
      type: String,
      enum: ["preview", "production", "staging"],
      default: "preview",
    },
    deployedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deploymentContext: {
      type: String,
      enum: ["production", "staging", "dev"],
      default: "production",
    },
    canaryDeployment: { type: Boolean, default: false },
    canaryPercentage: { type: Number, default: 10 },
    previousDeploymentId: mongoose.Schema.Types.ObjectId,
    rollbackReason: String,
    // Provider integration fields
    provider: {
      type: String,
      enum: ["vercel", "netlify", "render", "custom"],
      default: "custom",
    },
    providerDeploymentId: String, // ID from the provider's system
    providerMetadata: {
      projectId: String,
      siteId: String,
      serviceId: String,
      domainName: String,
      region: String,
      additionalData: mongoose.Schema.Types.Mixed,
    },
    providerConfig: {
      buildCommand: String,
      outputDirectory: String,
      framework: String,
      startCommand: String,
      env: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true },
)

deploymentSchema.index({ projectId: 1, createdAt: -1 })
deploymentSchema.index({ status: 1 })

module.exports = mongoose.model("Deployment", deploymentSchema)
