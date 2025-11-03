// Monitoring Controller - new comprehensive controller
const monitoringService = require("../services/monitoringService")

class MonitoringController {
  async recordMetric(req, res, next) {
    try {
      const { projectId, deploymentId, metricType, value, region } = req.body
      const metric = await monitoringService.recordMetric(projectId, deploymentId, metricType, value, region)
      res.status(201).json(metric)
    } catch (error) {
      next(error)
    }
  }

  async getMetrics(req, res, next) {
    try {
      const { projectId } = req.params
      const { metricType, timeRange = 7 } = req.query

      if (!metricType) {
        return res.status(400).json({ error: "metricType query parameter is required" })
      }

      const metrics = await monitoringService.getMetrics(projectId, metricType, Number.parseInt(timeRange))
      res.json(metrics)
    } catch (error) {
      next(error)
    }
  }

  async getMetricsSummary(req, res, next) {
    try {
      const { projectId } = req.params
      const { timeRange = 7 } = req.query
      const summary = await monitoringService.getProjectMetricsSummary(projectId, Number.parseInt(timeRange))
      res.json(summary)
    } catch (error) {
      next(error)
    }
  }

  async getServiceHealth(req, res, next) {
    try {
      const { projectId } = req.params
      const health = await monitoringService.getServiceHealth(projectId)
      res.json(health)
    } catch (error) {
      next(error)
    }
  }

  async getErrorLogs(req, res, next) {
    try {
      const { projectId } = req.params
      const { timeRange = 1 } = req.query
      const errors = await monitoringService.getErrorLogs(projectId, Number.parseInt(timeRange))
      res.json(errors)
    } catch (error) {
      next(error)
    }
  }

  async recordError(req, res, next) {
    try {
      const { projectId } = req.params
      const { service, error } = req.body
      const result = await monitoringService.recordError(projectId, service, error)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new MonitoringController()
