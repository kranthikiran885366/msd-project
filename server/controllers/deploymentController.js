const BaseController = require('./BaseController');
const deploymentService = require("../services/deploymentService");
const Project = require("../models/Project");

class DeploymentController extends BaseController {
    constructor() {
        super();
        BaseController.bindMethods(this);
    }
  async createDeployment(req, res, next) {
    try {
      const { projectId, gitCommit, gitBranch, gitAuthor, commitMessage, canaryDeployment } = req.body
      const deployment = await deploymentService.createDeployment({
        projectId,
        gitCommit,
        gitBranch,
        gitAuthor: gitAuthor || "system",
        commitMessage: commitMessage || "No message",
        canaryDeployment: canaryDeployment || false,
      })
      res.status(201).json(deployment)
    } catch (error) {
      next(error)
    }
  }

  async getAllDeployments(req, res, next) {
    try {
      const { limit = 50, status, environment } = req.query
      const filters = {}
      if (status) filters.status = status
      if (environment) filters.environment = environment

      const deployments = await deploymentService.getAllDeployments(Number.parseInt(limit), filters)
      res.json(deployments)
    } catch (error) {
      next(error)
    }
  }

  async getDeployments(req, res, next) {
    try {
      const { projectId } = req.params
      const { limit = 50, status, environment } = req.query
      const filters = {}
      if (status) filters.status = status
      if (environment) filters.environment = environment

      const deployments = await deploymentService.getDeployments(projectId, Number.parseInt(limit), filters)
      res.json(deployments)
    } catch (error) {
      next(error)
    }
  }

  async getDeploymentById(req, res, next) {
    try {
      const { id } = req.params
      const deployment = await deploymentService.getDeploymentById(id)
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" })
      }
      res.json(deployment)
    } catch (error) {
      next(error)
    }
  }

  async updateDeploymentStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status, metrics } = req.body
      const deployment = await deploymentService.updateDeploymentStatus(id, status, metrics || {})
      res.json(deployment)
    } catch (error) {
      next(error)
    }
  }

  async rollbackDeployment(req, res, next) {
    try {
      const { id } = req.params
      const { reason } = req.body
      const previousDeployment = await deploymentService.rollbackDeployment(id, reason || "User initiated rollback")
      res.json({ message: "Rollback successful", deployment: previousDeployment })
    } catch (error) {
      next(error)
    }
  }

  async getBuildCacheStatus(req, res, next) {
    try {
      const { projectId } = req.params
      const { cacheKey, framework } = req.query
      const cache = await deploymentService.checkBuildCache(projectId, cacheKey, framework)
      res.json({ cached: !!cache, cache })
    } catch (error) {
      next(error)
    }
  }

  async getDeploymentMetrics(req, res, next) {
    try {
      const { id } = req.params
      const metrics = await deploymentService.getDeploymentMetrics(id)
      res.json(metrics)
    } catch (error) {
      next(error)
    }
  }

  async getDeploymentLogs(req, res, next) {
    try {
      const { id } = req.params
      const logs = await deploymentService.getDeploymentLogs(id)
      res.json(logs)
    } catch (error) {
      next(error)
    }
  }

  async getProjectDeploymentAnalytics(req, res, next) {
    try {
      const { projectId } = req.params
      const { timeRange = 7 } = req.query
      const analytics = await deploymentService.getDeploymentAnalytics(projectId, Number.parseInt(timeRange))
      res.json(analytics)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new DeploymentController()
