// Request Validation Middleware
const validateDeploymentRequest = (req, res, next) => {
  const { projectId, gitCommit } = req.body
  if (!projectId || !gitCommit) {
    return res.status(400).json({ error: "projectId and gitCommit are required" })
  }
  next()
}

const validateProjectRequest = (req, res, next) => {
  const { name, framework } = req.body
  if (!name || !framework) {
    return res.status(400).json({ error: "name and framework are required" })
  }
  next()
}

const validateFunctionRequest = (req, res, next) => {
  const { name, path, runtime, handler } = req.body
  if (!name || !path || !runtime || !handler) {
    return res.status(400).json({ error: "name, path, runtime, and handler are required" })
  }
  next()
}

const validateBuildRequest = (req, res, next) => {
  const { projectId, deploymentId, config } = req.body
  if (!projectId || !deploymentId) {
    return res.status(400).json({ error: "projectId and deploymentId are required" })
  }
  next()
}

const validateMetricRequest = (req, res, next) => {
  const { projectId, metricType, value } = req.body
  if (!projectId || !metricType || value === undefined) {
    return res.status(400).json({ error: "projectId, metricType, and value are required" })
  }
  next()
}

const validateUpdateSettings = (req, res, next) => {
  // Skip empty updates
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "No settings provided for update" })
  }
  next()
}

module.exports = {
  validateDeploymentRequest,
  validateProjectRequest,
  validateFunctionRequest,
  validateBuildRequest,
  validateMetricRequest,
  validateUpdateSettings,
}
