// Log Service
const Log = require("../models/Log")

class LogService {
  async getLogs(projectId, options = {}) {
    const { deploymentId, level, service, limit = 100, skip = 0 } = options

    const query = {}
    if (projectId) query.projectId = projectId
    if (deploymentId) query.deploymentId = deploymentId
    if (level) query.level = level
    if (service) query.service = service

    return await Log.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip)
  }

  async getLogStats(projectId) {
    const logs = await Log.find({ projectId })
    const levelCounts = {}

    logs.forEach((log) => {
      levelCounts[log.level] = (levelCounts[log.level] || 0) + 1
    })

    return levelCounts
  }

  async clearLogs(projectId) {
    return await Log.deleteMany({ projectId })
  }

  async streamLogs(projectId, onLog) {
    const changeStream = Log.watch([{ $match: { "fullDocument.projectId": projectId } }])

    changeStream.on("change", (change) => {
      if (change.operationType === "insert") {
        onLog(change.fullDocument)
      }
    })

    return changeStream
  }
}

module.exports = new LogService()
