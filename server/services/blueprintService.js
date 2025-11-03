const Blueprint = require("../models/Blueprint")
const DeploymentService = require("./deploymentService")

class BlueprintService {
  constructor() {
    this.deploymentService = new DeploymentService()
  }

  async getBlueprints(projectId) {
    return await Blueprint.find({ projectId })
  }

  async createBlueprint(blueprintData) {
    const blueprint = new Blueprint(blueprintData)
    return await blueprint.save()
  }

  async updateBlueprint(id, updates) {
    return await Blueprint.findByIdAndUpdate(id, updates, { new: true })
  }

  async deleteBlueprint(id) {
    return await Blueprint.findByIdAndDelete(id)
  }

  async generateDeploymentConfig(blueprintId, options = {}) {
    const blueprint = await Blueprint.findById(blueprintId)
    if (!blueprint) throw new Error("Blueprint not found")

    // Deep clone the blueprint config
    const config = JSON.parse(JSON.stringify(blueprint.config))

    // Apply customizations from options
    if (options.environment) {
      config.environment = { ...config.environment, ...options.environment }
    }

    // Calculate costs and add region-specific settings
    config.resources = config.resources.map(resource => ({
      ...resource,
      cost: this.calculateResourceCost(resource),
      region: options.region || "us-east",
      settings: this.getResourceSettings(resource),
    }))

    return config
  }

  calculateResourceCost(resource) {
    const baseCosts = {
      "compute.small": 10,
      "compute.medium": 20,
      "compute.large": 40,
      "database.small": 15,
      "database.medium": 30,
      "database.large": 60,
      "storage.standard": 5,
      "storage.premium": 10,
    }

    const key = `${resource.type}.${resource.size}`
    return baseCosts[key] || 0
  }

  getResourceSettings(resource) {
    const settings = {
      compute: {
        small: { cpu: 1, memory: "2GB" },
        medium: { cpu: 2, memory: "4GB" },
        large: { cpu: 4, memory: "8GB" },
      },
      database: {
        small: { storage: "10GB", connections: 20 },
        medium: { storage: "50GB", connections: 50 },
        large: { storage: "100GB", connections: 100 },
      },
      storage: {
        standard: { iops: 100, throughput: "125MB/s" },
        premium: { iops: 1000, throughput: "500MB/s" },
      },
    }

    const [type, size] = [resource.type, resource.size]
    return settings[type]?.[size] || {}
  }

  async deployBlueprint(blueprintId, config) {
    const blueprint = await Blueprint.findById(blueprintId)
    if (!blueprint) throw new Error("Blueprint not found")

    // Create deployment from blueprint
    const deployment = await this.deploymentService.createDeployment({
      projectId: blueprint.projectId,
      blueprint: blueprint._id,
      config,
      status: "pending",
    })

    // Start deployment process
    await this.deploymentService.startDeployment(deployment._id)

    return deployment
  }

  validateBlueprintConfig(config) {
    // Implement validation logic here
    const errors = []

    if (!config.resources || !config.resources.length) {
      errors.push("At least one resource is required")
    }

    config.resources?.forEach((resource, index) => {
      if (!resource.type) {
        errors.push(`Resource ${index + 1}: Type is required`)
      }
      if (!resource.size) {
        errors.push(`Resource ${index + 1}: Size is required`)
      }
    })

    if (errors.length) {
      throw new Error(`Invalid blueprint config: ${errors.join(", ")}`)
    }
  }
}

module.exports = new BlueprintService()