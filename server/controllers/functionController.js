// Serverless Function Controller
const functionService = require("../services/functionService")

class FunctionController {
  async createFunction(req, res, next) {
    try {
      const { projectId } = req.params
      const func = await functionService.createFunction(projectId, req.body)
      res.status(201).json(func)
    } catch (error) {
      next(error)
    }
  }

  async getFunctions(req, res, next) {
    try {
      const { projectId } = req.params
      const functions = await functionService.getFunctions(projectId)
      res.json(functions)
    } catch (error) {
      next(error)
    }
  }

  async getFunctionById(req, res, next) {
    try {
      const { id } = req.params
      const func = await functionService.getFunctionById(id)
      if (!func) {
        return res.status(404).json({ error: "Function not found" })
      }
      res.json(func)
    } catch (error) {
      next(error)
    }
  }

  async updateFunction(req, res, next) {
    try {
      const { id } = req.params
      const func = await functionService.updateFunction(id, req.body)
      res.json(func)
    } catch (error) {
      next(error)
    }
  }

  async deleteFunction(req, res, next) {
    try {
      const { id } = req.params
      await functionService.deleteFunction(id)
      res.json({ message: "Function deleted successfully" })
    } catch (error) {
      next(error)
    }
  }

  async invokeFunction(req, res, next) {
    try {
      const { id } = req.params
      const result = await functionService.invokeFunction(id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async getFunctionMetrics(req, res, next) {
    try {
      const { id } = req.params
      const metrics = await functionService.getFunctionMetrics(id)
      res.json(metrics)
    } catch (error) {
      next(error)
    }
  }

  async toggleFunction(req, res, next) {
    try {
      const { id } = req.params
      const { enabled } = req.body
      const func = await functionService.toggleFunction(id, enabled)
      res.json(func)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new FunctionController()
