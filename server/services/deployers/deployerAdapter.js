/**
 * Base Deployer Adapter Contract
 * All provider adapters must implement these methods
 */

class DeployerAdapter {
  /**
   * Create a new deployment
   * @param {Object} project - Project data with git info
   * @param {Object} config - Deployment configuration
   * @returns {Promise<{providerDeploymentId, url, status, metadata}>}
   */
  async createDeployment(project, config) {
    throw new Error("createDeployment must be implemented")
  }

  /**
   * Get current deployment status
   * @param {string} providerDeploymentId - Provider-specific deployment ID
   * @returns {Promise<{status, progress, metadata, url}>}
   */
  async getDeploymentStatus(providerDeploymentId) {
    throw new Error("getDeploymentStatus must be implemented")
  }

  /**
   * Get deployment logs
   * @param {string} providerDeploymentId - Provider-specific deployment ID
   * @param {Object} options - { limit, offset }
   * @returns {Promise<{logs: Array, hasMore: boolean}>}
   */
  async getDeploymentLogs(providerDeploymentId, options = {}) {
    throw new Error("getDeploymentLogs must be implemented")
  }

  /**
   * List all deployments for a project
   * @param {string} projectId - Platform project ID
   * @param {Object} options - { limit, offset, status }
   * @returns {Promise<Array>}
   */
  async listDeployments(projectId, options = {}) {
    throw new Error("listDeployments must be implemented")
  }

  /**
   * Cancel a running deployment
   * @param {string} providerDeploymentId - Provider-specific deployment ID
   * @returns {Promise<{success, message}>}
   */
  async cancelDeployment(providerDeploymentId) {
    throw new Error("cancelDeployment must be implemented")
  }

  /**
   * Validate webhook signature and parse body
   * @param {string} signature - Provider signature header
   * @param {string} body - Raw webhook body
   * @returns {Promise<{valid: boolean, payload: Object}>}
   */
  async validateWebhook(signature, body) {
    throw new Error("validateWebhook must be implemented")
  }

  /**
   * Connect provider account (OAuth/token setup)
   * @param {Object} credentials - { token, teamId, etc. }
   * @returns {Promise<{connected: boolean, message, user_info}>}
   */
  async connectAccount(credentials) {
    throw new Error("connectAccount must be implemented")
  }

  /**
   * Disconnect provider account
   * @param {string} accountId - Provider account ID
   * @returns {Promise<{success: boolean}>}
   */
  async disconnectAccount(accountId) {
    throw new Error("disconnectAccount must be implemented")
  }

  /**
   * Map provider status to platform status
   */
  mapStatus(providerStatus) {
    const statusMap = {
      queued: "pending",
      building: "building",
      deploying: "deploying",
      ready: "running",
      running: "running",
      error: "failed",
      failed: "failed",
      canceled: "rolled-back",
    }
    return statusMap[providerStatus] || "pending"
  }

  /**
   * Retry logic with exponential backoff
   */
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
    throw lastError
  }
}

module.exports = DeployerAdapter
