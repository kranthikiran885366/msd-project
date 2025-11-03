const rbacService = require("../services/rbacService")

const rbacMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const { projectId } = req.params
    const resource = req.baseUrl.split("/")[1]
    const action = _mapMethodToAction(req.method)

    if (!userId || !projectId) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const hasPermission = await rbacService.checkPermission(userId, projectId, resource, action)

    if (!hasPermission) {
      // Log audit event
      await rbacService.auditAccessLog(
        projectId,
        userId,
        action,
        resource,
        null,
        false,
        req.ip,
        req.headers["user-agent"]
      )

      return res.status(403).json({ error: "Access denied" })
    }

    // Log successful access
    await rbacService.auditAccessLog(
      projectId,
      userId,
      action,
      resource,
      null,
      true,
      req.ip,
      req.headers["user-agent"]
    )

    next()
  } catch (error) {
    console.error("RBAC middleware error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

const _mapMethodToAction = (method) => {
  const mapping = {
    GET: "read",
    POST: "create",
    PATCH: "update",
    PUT: "update",
    DELETE: "delete",
  }
  return mapping[method] || "read"
}

module.exports = rbacMiddleware
