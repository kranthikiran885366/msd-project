/**
 * Render Deployer Adapter
 * Implements real API integration with Render platform
 * Docs: https://render.com/docs/api-reference
 */

const axios = require("axios")
const crypto = require("crypto")
const DeployerAdapter = require("./deployerAdapter")

class RenderAdapter extends DeployerAdapter {
  constructor() {
    super()
    this.apiBase = "https://api.render.com/v1"
    this.apiKey = process.env.RENDER_API_KEY || ""
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    }
  }

  /**
   * Create deployment on Render
   */
  async createDeployment(project, config) {
    if (!this.apiKey) {
      throw new Error("RENDER_API_KEY not configured")
    }

    try {
      // First, create or retrieve a service
      let serviceId = config.serviceId

      if (!serviceId) {
        // Create a new web service
        const servicePayload = {
          type: "web_service",
          name: config.name || project.name,
          ownerId: config.ownerId, // Required if creating new service
          repo: project.repository?.url,
          branch: config.branch || "main",
          rootDir: config.rootDirectory || "",
          buildCommand: config.buildCommand || "npm run build",
          startCommand: config.startCommand || "npm start",
          envVars: config.env
            ? Object.entries(config.env).map(([key, value]) => ({
                key,
                value,
                isFile: false,
              }))
            : [],
          serviceDetails: {
            env: "node",
            plan: config.plan || "free",
            numInstances: 1,
          },
        }

        const serviceResponse = await axios.post(`${this.apiBase}/services`, servicePayload, {
          headers: this.getHeaders(),
        })

        serviceId = serviceResponse.data.service.id
      }

      // Trigger a deployment
      const response = await axios.post(
        `${this.apiBase}/services/${serviceId}/deploys`,
        {
          clearCache: config.clearCache || false,
        },
        { headers: this.getHeaders() },
      )

      return {
        providerDeploymentId: response.data.deploy.id,
        url: `https://${response.data.deploy.domainName}`,
        status: this.mapStatus(response.data.deploy.status || "queued"),
        metadata: {
          provider: "render",
          serviceId,
          createdAt: response.data.deploy.createdAt,
          commit: response.data.deploy.commit,
        },
      }
    } catch (error) {
      throw new Error(`Render deployment failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Get deployment status from Render
   */
  async getDeploymentStatus(providerDeploymentId) {
    try {
      // Render returns deploys as part of service; fetch by deploy ID
      // Note: Render API may require service ID; this is a simplified call
      const response = await axios.get(`${this.apiBase}/deploys/${providerDeploymentId}`, {
        headers: this.getHeaders(),
      })

      const data = response.data.deploy
      const statusMap = {
        build_in_progress: "building",
        deploy_in_progress: "deploying",
        live: "running",
        canceled: "rolled-back",
        pre_deploy_in_progress: "building",
      }

      return {
        status: statusMap[data.status] || this.mapStatus(data.status),
        progress: this._calculateProgress(data.status),
        url: data.domainName ? `https://${data.domainName}` : null,
        metadata: {
          commit: data.commit?.id,
          createdAt: data.createdAt,
          finishedAt: data.finishedAt,
          errorMessage: data.errorMessage || null,
          logs: data.logs?.map((l) => l.message) || [],
        },
      }
    } catch (error) {
      throw new Error(`Failed to get Render deployment status: ${error.message}`)
    }
  }

  /**
   * Get deployment logs from Render
   */
  async getDeploymentLogs(providerDeploymentId, options = {}) {
    try {
      const limit = options.limit || 50
      const offset = options.offset || 0

      const response = await axios.get(`${this.apiBase}/deploys/${providerDeploymentId}/logs`, {
        params: {
          limit,
          offset,
        },
        headers: this.getHeaders(),
      })

      const logs = (response.data.logs || []).map((log) => ({
        timestamp: log.timestamp,
        message: log.message,
        level: log.level === "error" ? "error" : log.level === "warn" ? "warn" : "info",
      }))

      return {
        logs,
        hasMore: logs.length === limit,
      }
    } catch (error) {
      throw new Error(`Failed to get Render deployment logs: ${error.message}`)
    }
  }

  /**
   * List deployments for a service
   */
  async listDeployments(serviceId, options = {}) {
    try {
      const params = {
        limit: options.limit || 10,
        offset: options.offset || 0,
      }

      const response = await axios.get(`${this.apiBase}/services/${serviceId}/deploys`, {
        params,
        headers: this.getHeaders(),
      })

      return (response.data.deploys || []).map((dep) => ({
        id: dep.id,
        status: this.mapStatus(dep.status),
        url: dep.domainName ? `https://${dep.domainName}` : null,
        createdAt: dep.createdAt,
        commit: dep.commit?.id,
      }))
    } catch (error) {
      throw new Error(`Failed to list Render deployments: ${error.message}`)
    }
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(providerDeploymentId) {
    try {
      await axios.post(
        `${this.apiBase}/deploys/${providerDeploymentId}/cancel`,
        {},
        { headers: this.getHeaders() },
      )

      return { success: true, message: "Deployment canceled" }
    } catch (error) {
      throw new Error(`Failed to cancel Render deployment: ${error.message}`)
    }
  }

  /**
   * Validate Render webhook signature
   * Render sends X-Render-Webhook-Signature header with SHA-256 HMAC
   */
  async validateWebhook(signature, body) {
    try {
      const webhookSecret = process.env.RENDER_WEBHOOK_SECRET || ""
      const hash = crypto.createHmac("sha256", webhookSecret).update(body).digest("base64")

      const valid = hash === signature
      return {
        valid,
        payload: valid ? JSON.parse(body) : null,
      }
    } catch (error) {
      return { valid: false, payload: null }
    }
  }

  /**
   * Connect Render account
   */
  async connectAccount(credentials) {
    try {
      if (!credentials.apiKey) {
        throw new Error("API key required")
      }

      const response = await axios.get("https://api.render.com/v1/owners", {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
      })

      return {
        connected: true,
        message: "Connected to Render",
        user_info: {
          owners: response.data.owners?.map((o) => ({ id: o.id, name: o.name })) || [],
        },
      }
    } catch (error) {
      throw new Error(`Failed to connect Render account: ${error.message}`)
    }
  }

  /**
   * Disconnect Render account
   */
  async disconnectAccount(accountId) {
    return { success: true }
  }

  /**
   * Helper: calculate progress from Render deployment status
   */
  _calculateProgress(status) {
    const progressMap = {
      build_in_progress: 25,
      deploy_in_progress: 75,
      live: 100,
      canceled: 0,
      pre_deploy_in_progress: 10,
    }
    return progressMap[status] || 50
  }
}

module.exports = new RenderAdapter()
