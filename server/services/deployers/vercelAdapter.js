/**
 * Vercel Deployer Adapter
 * Implements real API integration with Vercel platform
 * Docs: https://vercel.com/docs/rest-api
 */

const axios = require("axios")
const crypto = require("crypto")
const DeployerAdapter = require("./deployerAdapter")

class VercelAdapter extends DeployerAdapter {
  constructor() {
    super()
    this.apiBase = "https://api.vercel.com"
    this.token = process.env.VERCEL_TOKEN || ""
    this.teamId = process.env.VERCEL_TEAM_ID || null
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    }
  }

  /**
   * Create deployment on Vercel
   */
  async createDeployment(project, config) {
    if (!this.token) {
      throw new Error("VERCEL_TOKEN not configured")
    }

    try {
      // Deploy from git or files
      const deployPayload = {
        name: config.name || project.name,
        gitSource: {
          type: "github", // or gitlab, bitbucket
          repo: project.repository?.url?.split("/").slice(-2).join("/").replace(".git", ""),
          ref: config.branch || project.repository?.branch || "main",
        },
        projectSettings: {
          framework: config.framework || "nextjs",
          buildCommand: config.buildCommand || null,
          outputDirectory: config.outputDirectory || null,
          rootDirectory: config.rootDirectory || null,
        },
        environmentVariables: config.env ? Object.entries(config.env).map(([key, value]) => ({ key, value })) : [],
      }

      if (this.teamId) {
        deployPayload.teamId = this.teamId
      }

      const response = await axios.post(`${this.apiBase}/v13/deployments`, deployPayload, {
        headers: this.getHeaders(),
      })

      return {
        providerDeploymentId: response.data.id,
        url: response.data.url || `https://${response.data.name}.vercel.app`,
        status: this.mapStatus(response.data.readyState || "queued"),
        metadata: {
          provider: "vercel",
          projectId: response.data.projectId,
          createdAt: response.data.createdAt,
          creator: response.data.creator?.login,
        },
      }
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Get deployment status from Vercel
   */
  async getDeploymentStatus(providerDeploymentId) {
    try {
      const response = await axios.get(`${this.apiBase}/v13/deployments/${providerDeploymentId}`, {
        headers: this.getHeaders(),
      })

      const data = response.data
      return {
        status: this.mapStatus(data.readyState),
        progress: data.readyState === "READY" ? 100 : 50,
        url: data.url || `https://${data.name}.vercel.app`,
        metadata: {
          regions: data.regions,
          source: data.source,
          errorMessage: data.errorMessage || null,
          buildTime: data.buildingAt && data.readyAt ? data.readyAt - data.buildingAt : null,
          functions: data.functions?.length || 0,
        },
      }
    } catch (error) {
      throw new Error(`Failed to get Vercel deployment status: ${error.message}`)
    }
  }

  /**
   * Get deployment logs from Vercel
   */
  async getDeploymentLogs(providerDeploymentId, options = {}) {
    try {
      const limit = options.limit || 50
      const offset = options.offset || 0

      // Vercel logs are available via build/deployment details
      const response = await axios.get(`${this.apiBase}/v13/deployments/${providerDeploymentId}/builds`, {
        headers: this.getHeaders(),
      })

      const logs = (response.data.builds || []).map((build) => ({
        timestamp: build.createdAt,
        message: build.description || "Build step completed",
        level: build.state === "READY" ? "info" : build.state === "ERROR" ? "error" : "warn",
        duration: build.duration,
      }))

      return {
        logs: logs.slice(offset, offset + limit),
        hasMore: logs.length > offset + limit,
      }
    } catch (error) {
      throw new Error(`Failed to get Vercel deployment logs: ${error.message}`)
    }
  }

  /**
   * List deployments for a project
   */
  async listDeployments(projectId, options = {}) {
    try {
      const params = {
        projectId,
        limit: options.limit || 10,
        skip: options.offset || 0,
      }

      if (options.status) {
        params.state = options.status.toUpperCase()
      }

      const response = await axios.get(`${this.apiBase}/v5/deployments`, {
        params,
        headers: this.getHeaders(),
      })

      return (response.data.deployments || []).map((dep) => ({
        id: dep.id,
        name: dep.name,
        status: this.mapStatus(dep.readyState),
        url: dep.url,
        createdAt: dep.createdAt,
        creator: dep.creator?.login,
      }))
    } catch (error) {
      throw new Error(`Failed to list Vercel deployments: ${error.message}`)
    }
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(providerDeploymentId) {
    try {
      await axios.patch(`${this.apiBase}/v13/deployments/${providerDeploymentId}/cancel`, {}, { headers: this.getHeaders() })

      return { success: true, message: "Deployment canceled" }
    } catch (error) {
      throw new Error(`Failed to cancel Vercel deployment: ${error.message}`)
    }
  }

  /**
   * Validate Vercel webhook signature
   * Vercel sends X-Vercel-Signature header with HMAC SHA-1
   */
  async validateWebhook(signature, body) {
    try {
      const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET || ""
      const hash = crypto.createHmac("sha1", webhookSecret).update(body).digest("hex")

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
   * Connect Vercel account
   */
  async connectAccount(credentials) {
    try {
      if (!credentials.token) {
        throw new Error("Token required")
      }

      const response = await axios.get("https://api.vercel.com/v2/user", {
        headers: { Authorization: `Bearer ${credentials.token}` },
      })

      return {
        connected: true,
        message: "Connected to Vercel",
        user_info: {
          id: response.data.user.id,
          email: response.data.user.email,
          username: response.data.user.username,
        },
      }
    } catch (error) {
      throw new Error(`Failed to connect Vercel account: ${error.message}`)
    }
  }

  /**
   * Disconnect Vercel account
   */
  async disconnectAccount(accountId) {
    // Vercel doesn't have a disconnect endpoint; just return success
    // The platform can remove the stored token
    return { success: true }
  }
}

module.exports = new VercelAdapter()
