// Build Controller - comprehensive controller for build operations
const buildService = require("../services/buildService")
const BuildOptimizer = require("../utils/buildOptimizer")

class BuildController {
  async createBuild(req, res, next) {
    try {
      const { projectId } = req.params
      const buildData = req.body
      
      const build = await buildService.createBuild(projectId, buildData)
      res.status(201).json(build)
    } catch (error) {
      next(error)
    }
  }

  async getBuildsByProject(req, res, next) {
    try {
      const { projectId } = req.params
      const { limit = 50, status, branch } = req.query
      const filters = {}
      if (status) filters.status = status
      if (branch) filters.branch = branch

      const builds = await buildService.getBuildsByProject(projectId, Number.parseInt(limit), filters)
      res.json(builds)
    } catch (error) {
      next(error)
    }
  }

  async getBuildById(req, res, next) {
    try {
      const { id } = req.params
      const build = await buildService.getBuildById(id)
      if (!build) {
        return res.status(404).json({ error: 'Build not found' })
      }
      res.json(build)
    } catch (error) {
      next(error)
    }
  }

  async updateBuildStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status, metrics } = req.body
      
      const build = await buildService.updateBuildStatus(id, status, metrics || {})
      res.json(build)
    } catch (error) {
      next(error)
    }
  }

  async addBuildLog(req, res, next) {
    try {
      const { buildId } = req.params
      const { message, level } = req.body
      
      const build = await buildService.addBuildLog(buildId, { message, level })
      res.json(build)
    } catch (error) {
      next(error)
    }
  }

  async addBuildStep(req, res, next) {
    try {
      const { buildId } = req.params
      const { name, command } = req.body
      
      const build = await buildService.addBuildStep(buildId, { name, command })
      res.json(build)
    } catch (error) {
      next(error)
    }
  }

  async updateBuildStep(req, res, next) {
    try {
      const { buildId, stepName } = req.params
      const updates = req.body
      
      const build = await buildService.updateBuildStep(buildId, stepName, updates)
      res.json(build)
    } catch (error) {
      next(error)
    }
  }

  async executeBuildHooks(req, res, next) {
    try {
      const { buildId } = req.params
      const { hookType } = req.query
      
      const results = await buildService.executeBuildHooks(buildId, hookType)
      res.json({ results })
    } catch (error) {
      next(error)
    }
  }

  async retryBuild(req, res, next) {
    try {
      const { buildId } = req.params
      
      const newBuild = await buildService.retryBuild(buildId)
      res.status(201).json(newBuild)
    } catch (error) {
      next(error)
    }
  }

  async cancelBuild(req, res, next) {
    try {
      const { buildId } = req.params
      const { reason } = req.body
      
      const build = await buildService.cancelBuild(buildId, reason || 'Canceled by user')
      res.json(build)
    } catch (error) {
      next(error)
    }
  }

  async getBuildLogs(req, res, next) {
    try {
      const { buildId } = req.params
      
      const logs = await buildService.getBuildLogs(buildId)
      res.json({ logs })
    } catch (error) {
      next(error)
    }
  }

  async getBuildMetrics(req, res, next) {
    try {
      const { buildId } = req.params
      
      const metrics = await buildService.getBuildMetrics(buildId)
      res.json(metrics)
    } catch (error) {
      next(error)
    }
  }

  async getBuildAnalytics(req, res, next) {
    try {
      const { projectId } = req.params
      const { timeRange = 7 } = req.query
      
      const analytics = await buildService.getBuildAnalytics(projectId, Number.parseInt(timeRange))
      res.json(analytics)
    } catch (error) {
      next(error)
    }
  }

  async getCacheSummary(req, res, next) {
    try {
      const { projectId } = req.params

      const summary = await buildService.getCacheSummary(projectId)
      res.json(summary)
    } catch (error) {
      next(error)
    }
  }

  async generateCacheKey(req, res, next) {
    try {
      const { framework, dependencies, buildConfig } = req.body

      const cacheKey = BuildOptimizer.generateCacheKey(framework, dependencies, buildConfig)
      const estimatedTime = BuildOptimizer.estimateBuildTime(framework, 75)

      res.json({
        cacheKey,
        estimatedBuildTime: estimatedTime,
        optimizedConfig: BuildOptimizer.optimizeBuildConfig(framework, buildConfig),
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new BuildController()
