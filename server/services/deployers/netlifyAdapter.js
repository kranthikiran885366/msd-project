/**
 * Netlify Deployer Adapter
 * Implements real API integration with Netlify platform
 * Docs: https://docs.netlify.com/api/get-started/
 */

const axios = require("axios")
const crypto = require("crypto")
const DeployerAdapter = require("./deployerAdapter")

class NetlifyAdapter extends DeployerAdapter {
  constructor() {
    super()
    this.apiBase = "https://api.netlify.com/api/v1"
    this.token = process.env.NETLIFY_TOKEN || ""
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    }
  }

  /**
   * Create deployment on Netlify
   */
  async createDeployment(project, config) {
    if (!this.token) {
      throw new Error("NETLIFY_TOKEN not configured")
    }

    try {
      // First, find or create a Netlify site
      let siteId = config.siteId

      if (!siteId) {
        // Create a new site if needed
        const siteResponse = await axios.post(
          `${this.apiBase}/sites`,
          {
            name: config.name || project.name,
          },
          { headers: this.getHeaders() },
        )
        siteId = siteResponse.data.id
      }

      // Trigger a deployment from git
      const deployPayload = {
        title: config.branch || "deploy",
      }

      // For git-based deployments, configure the site first
      if (project.repository?.url) {
        await axios.patch(
          `${this.apiBase}/sites/${siteId}`,
          {
            repo: {
              provider: "github", // or gitlab, bitbucket
              repo: project.repository.url.split("/").slice(-2).join("/").replace(".git", ""),
              branch: config.branch || "main",
              private: !project.repository.public,
              cmd: config.buildCommand || "npm run build",
              dir: config.outputDirectory || "dist",
            },
          },
          { headers: this.getHeaders() },
        )
      }

      const response = await axios.post(
        `${this.apiBase}/sites/${siteId}/builds`,
        deployPayload,
        { headers: this.getHeaders() },
      )

      return {
        providerDeploymentId: response.data.id,
        url: `https://${response.data.name || siteId}.netlify.app`,
        status: this.mapStatus(response.data.state || "queued"),
        metadata: {
          provider: "netlify",
          siteId,
          createdAt: response.data.created_at,
          creator: response.data.user?.email,
        },
      }
    } catch (error) {
      throw new Error(`Netlify deployment failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Get deployment status from Netlify
   */
  async getDeploymentStatus(providerDeploymentId) {
    try {
      const response = await axios.get(`${this.apiBase}/builds/${providerDeploymentId}`, {
        headers: this.getHeaders(),
      })

      const data = response.data
      const status = this.mapStatus(data.state)

      return {
        status,
        progress: data.state === "ready" ? 100 : data.state === "error" ? 0 : 50,
        url: data.preview_url || data.url,
        metadata: {
          duration: data.duration,
          deployTime: data.deploy_time,
          errorMessage: data.error_message || null,
          logs: data.summary?.messages?.map((m) => m.text) || [],
        },
      }
    } catch (error) {
      throw new Error(`Failed to get Netlify deployment status: ${error.message}`)
    }
  }

  /**
   * Get deployment logs from Netlify
   */
  async getDeploymentLogs(providerDeploymentId, options = {}) {
    try {
      const limit = options.limit || 50
      const offset = options.offset || 0

      const response = await axios.get(`${this.apiBase}/builds/${providerDeploymentId}/log`, {
        headers: this.getHeaders(),
      })

      const logLines = (response.data.log || []).map((entry) => ({
        timestamp: entry.ts,
        message: entry.message,
        level: entry.type === "error" ? "error" : "info",
      }))

      return {
        logs: logLines.slice(offset, offset + limit),
        hasMore: logLines.length > offset + limit,
      }
    } catch (error) {
      throw new Error(`Failed to get Netlify deployment logs: ${error.message}`)
    }
  }

  /**
   * List deployments for a site
   */
  async listDeployments(siteId, options = {}) {
    try {
      const params = {
        per_page: options.limit || 10,
        page: Math.floor((options.offset || 0) / (options.limit || 10)),
      }

      if (options.status) {
        params.state = options.status
      }

      const response = await axios.get(`${this.apiBase}/sites/${siteId}/builds`, {
        params,
        headers: this.getHeaders(),
      })

      return (response.data || []).map((dep) => ({
        id: dep.id,
        status: this.mapStatus(dep.state),
        url: dep.preview_url || dep.url,
        createdAt: dep.created_at,
        creator: dep.user?.email,
        duration: dep.duration,
      }))
    } catch (error) {
      throw new Error(`Failed to list Netlify deployments: ${error.message}`)
    }
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(providerDeploymentId) {
    try {
      // Netlify doesn't have a direct cancel endpoint
      // Deployments automatically complete or fail
      return { success: true, message: "Deployment cancellation not supported by Netlify" }
    } catch (error) {
      throw new Error(`Failed to cancel Netlify deployment: ${error.message}`)
    }
  }

  /**
   * Validate Netlify webhook signature
   * Netlify sends X-Webhook-Signature header with SHA-256 HMAC
   */
  async validateWebhook(signature, body) {
    try {
      const webhookSecret = process.env.NETLIFY_WEBHOOK_SECRET || ""
      const hash = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

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
   * Connect Netlify account
   */
  async connectAccount(credentials) {
    try {
      if (!credentials.token) {
        throw new Error("Token required")
      }

      const response = await axios.get("https://api.netlify.com/api/v1/user", {
        headers: { Authorization: `Bearer ${credentials.token}` },
      })

      return {
        connected: true,
        message: "Connected to Netlify",
        user_info: {
          id: response.data.id,
          email: response.data.email,
          login: response.data.login,
        },
      }
    } catch (error) {
      throw new Error(`Failed to connect Netlify account: ${error.message}`)
    }
  }

  /**
   * Disconnect Netlify account
   */
  async disconnectAccount(accountId) {
    return { success: true }
  }
}

module.exports = new NetlifyAdapter()
