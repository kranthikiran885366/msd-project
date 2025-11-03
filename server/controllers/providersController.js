/**
 * Providers Controller
 * Handles provider authentication, webhooks, and management
 */

const deployerFactory = require("../services/deployers/deployerFactory")
const deploymentService = require("../services/deploymentService")
const Deployment = require("../models/Deployment")
const Project = require("../models/Project")
const AuditLog = require("../models/AuditLog")

class ProvidersController {
  /**
   * Get supported providers
   */
  async getSupportedProviders(req, res, next) {
    try {
      const providers = deployerFactory.getSupportedProviders()
      res.json({
        providers: providers.map((p) => ({
          name: p,
          displayName: p.charAt(0).toUpperCase() + p.slice(1),
          description: this._getProviderDescription(p),
        })),
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Connect provider account
   */
  async connectProvider(req, res, next) {
    try {
      const { provider, credentials } = req.body
      const userId = req.user.id

      if (!provider || !credentials) {
        return res.status(400).json({ error: "Provider and credentials required" })
      }

      const result = await deployerFactory.connectAccount(provider, credentials)

      // Store provider connection
      const user = req.user
      user.connectedProviders = user.connectedProviders || {}
      user.connectedProviders[provider] = {
        connected: true,
        connectedAt: new Date(),
        userInfo: result.user_info,
      }

      // Save credentials securely (in production, use vault/KMS)
      // For now, we'll store an encrypted reference
      // In production: implement proper encryption

      await AuditLog.create({
        userId,
        action: `PROVIDER_CONNECTED_${provider.toUpperCase()}`,
        resource: "provider",
        resourceId: provider,
        metadata: { provider, userInfo: result.user_info },
      })

      res.json({
        success: true,
        message: result.message,
        userInfo: result.user_info,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Start deployment with provider
   */
  async startDeployment(req, res, next) {
    try {
      const { projectId, provider, config } = req.body
      const userId = req.user.id

      const project = await Project.findById(projectId)
      if (!project) {
        return res.status(404).json({ error: "Project not found" })
      }

      // Create deployment
      const deployment = await deploymentService.createDeployment({
        projectId,
        gitCommit: config.gitCommit || "HEAD",
        gitBranch: config.gitBranch || project.repository?.branch,
        gitAuthor: req.user.name,
        commitMessage: config.commitMessage || "Deployment from CloudDeck",
        provider,
        providerConfig: config,
      })

      // Start with provider
      const result = await deploymentService.startDeploymentWithProvider(deployment._id, project, config)

      await AuditLog.create({
        userId,
        action: `DEPLOYMENT_STARTED_${provider.toUpperCase()}`,
        resource: "deployment",
        resourceId: deployment._id,
        metadata: {
          provider,
          projectId,
          providerDeploymentId: result.providerDeploymentId,
        },
      })

      res.status(202).json({
        deployment: deployment._id,
        providerDeploymentId: result.providerDeploymentId,
        status: result.status,
        url: result.url,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get deployment status from provider
   */
  async getDeploymentStatus(req, res, next) {
    try {
      const { deploymentId } = req.params

      const status = await deploymentService.pollDeploymentStatus(deploymentId)

      res.json(status)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get deployment logs from provider
   */
  async getDeploymentLogs(req, res, next) {
    try {
      const { deploymentId } = req.params
      const { limit = 50, offset = 0 } = req.query

      const logs = await deploymentService.getProviderLogs(deploymentId, { limit, offset })

      res.json(logs)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Cancel deployment
   */
  async cancelDeployment(req, res, next) {
    try {
      const { deploymentId } = req.params
      const userId = req.user.id

      const deployment = await deploymentService.getDeploymentById(deploymentId)
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" })
      }

      const result = await deploymentService.cancelDeploymentViaProvider(deploymentId)

      await AuditLog.create({
        userId,
        action: "DEPLOYMENT_CANCELED",
        resource: "deployment",
        resourceId: deploymentId,
        metadata: { provider: deployment.provider },
      })

      res.json({
        success: true,
        message: result.message,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Handle provider webhooks
   */
  async handleWebhook(req, res, next) {
    try {
      const { provider } = req.params
      const signature = req.headers["x-" + provider + "-signature"] || req.headers["x-webhook-signature"]

      // Validate webhook signature
      const validation = await deployerFactory.validateWebhook(provider, signature, JSON.stringify(req.body))

      if (!validation.valid) {
        return res.status(401).json({ error: "Invalid webhook signature" })
      }

      const payload = validation.payload

      // Update deployment status based on webhook
      if (payload.deploymentId) {
        const deployment = await Deployment.findOne({ providerDeploymentId: payload.deploymentId })

        if (deployment) {
          const statusMap = {
            "READY": "running",
            "ERROR": "failed",
            "CANCELED": "rolled-back",
            "BUILDING": "building",
            "QUEUED": "pending",
          }

          const newStatus = statusMap[payload.state] || payload.state

          await deploymentService.updateDeploymentStatus(deployment._id, newStatus, {
            deployTime: payload.deployTime,
            buildTime: payload.buildTime,
          })

          // Log webhook event
          await AuditLog.create({
            action: `WEBHOOK_${provider.toUpperCase()}`,
            resource: "deployment",
            resourceId: deployment._id,
            metadata: {
              provider,
              state: payload.state,
              deploymentId: payload.deploymentId,
            },
          })
        }
      }

      res.json({ received: true })
    } catch (error) {
      // Log webhook error but return 200 to avoid retries
      console.error(`Webhook error for provider ${req.params.provider}:`, error)
      res.json({ received: true })
    }
  }

  /**
   * Disconnect provider account
   */
  async disconnectProvider(req, res, next) {
    try {
      const { provider } = req.params
      const userId = req.user.id

      // Remove provider connection from user
      const user = req.user
      if (user.connectedProviders?.[provider]) {
        delete user.connectedProviders[provider]
      }

      await deployerFactory.disconnectAccount(provider, userId)

      await AuditLog.create({
        userId,
        action: `PROVIDER_DISCONNECTED_${provider.toUpperCase()}`,
        resource: "provider",
        resourceId: provider,
      })

      res.json({ success: true, message: `Disconnected from ${provider}` })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Helper: get provider description
   */
  _getProviderDescription(provider) {
    const descriptions = {
      vercel: "Deploy to Vercel for Next.js applications and static sites",
      netlify: "Deploy to Netlify with auto-builds and serverless functions",
      render: "Deploy to Render with automatic deployments and free tier support",
    }
    return descriptions[provider] || "Cloud deployment provider"
  }
}

module.exports = new ProvidersController()
