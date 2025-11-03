// Log Controller
const logService = require("../services/logService")

class LogController {
  async getLogs(req, res, next) {
    try {
      const { projectId } = req.params
      const { deploymentId, level, service, limit, skip } = req.query
      const logs = await logService.getLogs(projectId, {
        deploymentId,
        level,
        service,
        limit: Number.parseInt(limit) || 100,
        skip: Number.parseInt(skip) || 0,
      })
      res.json(logs)
    } catch (error) {
      next(error)
    }
  }

  async getLogStats(req, res, next) {
    try {
      const { projectId } = req.params
      const stats = await logService.getLogStats(projectId)
      res.json(stats)
    } catch (error) {
      next(error)
    }
  }

  async clearLogs(req, res, next) {
    try {
      const { projectId } = req.params
      await logService.clearLogs(projectId)
      res.json({ message: "Logs cleared successfully" })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new LogController()
