/**
 * Deployer Factory
 * Manages and returns appropriate adapter instances
 */

const vercelAdapter = require("./vercelAdapter")
const netlifyAdapter = require("./netlifyAdapter")
const renderAdapter = require("./renderAdapter")

class DeployerFactory {
  constructor() {
    this.adapters = {
      vercel: vercelAdapter,
      netlify: netlifyAdapter,
      render: renderAdapter,
    }
  }

  /**
   * Get adapter by provider name
   */
  getAdapter(provider) {
    const adapter = this.adapters[provider?.toLowerCase()]
    if (!adapter) {
      throw new Error(`Unknown deployer provider: ${provider}. Supported: ${Object.keys(this.adapters).join(", ")}`)
    }
    return adapter
  }

  /**
   * Get list of supported providers
   */
  getSupportedProviders() {
    return Object.keys(this.adapters)
  }

  /**
   * Register a new adapter
   */
  registerAdapter(name, adapter) {
    this.adapters[name.toLowerCase()] = adapter
  }

  /**
   * Create deployment using appropriate adapter
   */
  async createDeployment(provider, project, config) {
    const adapter = this.getAdapter(provider)
    try {
      const result = await adapter.createDeployment(project, config)
      return {
        ...result,
        provider,
      }
    } catch (error) {
      throw new Error(`${provider} deployment error: ${error.message}`)
    }
  }

  /**
   * Get status using appropriate adapter
   */
  async getDeploymentStatus(provider, deploymentId) {
    const adapter = this.getAdapter(provider)
    return await adapter.getDeploymentStatus(deploymentId)
  }

  /**
   * Get logs using appropriate adapter
   */
  async getDeploymentLogs(provider, deploymentId, options) {
    const adapter = this.getAdapter(provider)
    return await adapter.getDeploymentLogs(deploymentId, options)
  }

  /**
   * List deployments using appropriate adapter
   */
  async listDeployments(provider, projectId, options) {
    const adapter = this.getAdapter(provider)
    return await adapter.listDeployments(projectId, options)
  }

  /**
   * Cancel deployment using appropriate adapter
   */
  async cancelDeployment(provider, deploymentId) {
    const adapter = this.getAdapter(provider)
    return await adapter.cancelDeployment(deploymentId)
  }

  /**
   * Validate webhook for a provider
   */
  async validateWebhook(provider, signature, body) {
    const adapter = this.getAdapter(provider)
    return await adapter.validateWebhook(signature, body)
  }

  /**
   * Connect provider account
   */
  async connectAccount(provider, credentials) {
    const adapter = this.getAdapter(provider)
    return await adapter.connectAccount(credentials)
  }

  /**
   * Disconnect provider account
   */
  async disconnectAccount(provider, accountId) {
    const adapter = this.getAdapter(provider)
    return await adapter.disconnectAccount(accountId)
  }
}

module.exports = new DeployerFactory()
