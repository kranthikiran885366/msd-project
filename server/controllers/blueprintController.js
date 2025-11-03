const blueprintService = require("../services/blueprintService")

class BlueprintController {
  async listBlueprints(req, res, next) {
    try {
      const { projectId } = req.params
      const blueprints = await blueprintService.getBlueprints(projectId)
      res.json(blueprints)
    } catch (error) {
      next(error)
    }
  }

  async createBlueprint(req, res, next) {
    try {
      const blueprint = await blueprintService.createBlueprint({
        ...req.body,
        projectId: req.params.projectId,
      })
      res.status(201).json(blueprint)
    } catch (error) {
      next(error)
    }
  }

  async updateBlueprint(req, res, next) {
    try {
      const { id } = req.params
      const blueprint = await blueprintService.updateBlueprint(id, req.body)
      res.json(blueprint)
    } catch (error) {
      next(error)
    }
  }

  async deleteBlueprint(req, res, next) {
    try {
      const { id } = req.params
      await blueprintService.deleteBlueprint(id)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  async generateDeploymentConfig(req, res, next) {
    try {
      const { id } = req.params
      const config = await blueprintService.generateDeploymentConfig(id, req.query)
      res.json(config)
    } catch (error) {
      next(error)
    }
  }

  async deployBlueprint(req, res, next) {
    try {
      const { id } = req.params
      const deployment = await blueprintService.deployBlueprint(id, req.body)
      res.json(deployment)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new BlueprintController()