// Environment Variables Service
const Environment = require("../models/Environment")

class EnvironmentService {
  async createEnvironment(projectId, data, userId) {
    const env = new Environment({
      projectId,
      name: data.name,
      value: data.value,
      scope: data.scope || "prod",
      isSecret: data.isSecret || false,
      createdBy: userId,
    })

    await env.save()
    return env
  }

  async getEnvironments(projectId, scope) {
    const query = { projectId }
    if (scope) query.scope = scope
    return await Environment.find(query)
  }

  async getEnvironmentById(id) {
    return await Environment.findById(id)
  }

  async updateEnvironment(id, data) {
    return await Environment.findByIdAndUpdate(id, data, { new: true })
  }

  async deleteEnvironment(id) {
    return await Environment.findByIdAndDelete(id)
  }

  async getEnvironmentsByScope(projectId, scope) {
    return await Environment.find({ projectId, scope })
  }
}

module.exports = new EnvironmentService()
