// Environment Variables Controller
const environmentService = require("../services/environmentService")

class EnvironmentController {
  async createEnvironment(req, res, next) {
    try {
      const { projectId } = req.params
      const env = await environmentService.createEnvironment(projectId, req.body, req.user.userId)
      res.status(201).json(env)
    } catch (error) {
      next(error)
    }
  }

  async getEnvironments(req, res, next) {
    try {
      const { projectId } = req.params
      const { scope } = req.query
      const envs = await environmentService.getEnvironments(projectId, scope)
      res.json(envs)
    } catch (error) {
      next(error)
    }
  }

  async updateEnvironment(req, res, next) {
    try {
      const { id } = req.params
      const env = await environmentService.updateEnvironment(id, req.body)
      res.json(env)
    } catch (error) {
      next(error)
    }
  }

  async deleteEnvironment(req, res, next) {
    try {
      const { id } = req.params
      await environmentService.deleteEnvironment(id)
      res.json({ message: "Environment variable deleted successfully" })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new EnvironmentController()
