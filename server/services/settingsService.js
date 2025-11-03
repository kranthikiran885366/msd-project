const EnvironmentVar = require("../models/EnvironmentVar")
const Domain = require("../models/Domain")

class SettingsService {
  async createEnvVar(data) {
    const envVar = new EnvironmentVar(data)
    await envVar.save()
    return envVar
  }

  async getEnvVar(varId) {
    return await EnvironmentVar.findById(varId)
  }

  async updateEnvVar(varId, data) {
    return await EnvironmentVar.findByIdAndUpdate(varId, data, { new: true })
  }

  async deleteEnvVar(varId) {
    return await EnvironmentVar.findByIdAndDelete(varId)
  }

  async addDomain(data) {
    const domain = new Domain(data)
    await domain.save()
    return domain
  }

  async getDomain(domainId) {
    return await Domain.findById(domainId)
  }

  async updateDomain(domainId, data) {
    return await Domain.findByIdAndUpdate(domainId, data, { new: true })
  }

  async deleteDomain(domainId) {
    return await Domain.findByIdAndDelete(domainId)
  }

  async getBuildSettings(projectId) {
    // Return default build settings or fetch from a BuildSettings model
    return {
      projectId,
      cacheEnabled: true,
      timeout: 3600,
      maxRetries: 3,
      environment: "production"
    }
  }

  async updateBuildSettings(data) {
    // Update build settings logic
    return data
  }

  async getSettings(projectId) {
    return {
      projectId,
      autoDeploy: true,
      notifySlack: false,
      theme: "auto"
    }
  }

  async updateSettings(projectId, settings) {
    return {
      projectId,
      ...settings
    }
  }
}

module.exports = new SettingsService()
