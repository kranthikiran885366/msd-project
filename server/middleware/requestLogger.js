// Request Logger Middleware
const Log = require("../models/Log")

const requestLogger = async (req, res, next) => {
  const startTime = Date.now()

  const originalJson = res.json
  res.json = function (data) {
    const duration = Date.now() - startTime
    const logLevel = res.statusCode >= 400 ? "error" : res.statusCode >= 300 ? "warn" : "info"

    Log.create({
      service: req.path,
      level: logLevel,
      message: `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
    }).catch((err) => console.error("Log creation failed:", err))

    return originalJson.call(this, data)
  }

  next()
}

module.exports = requestLogger
