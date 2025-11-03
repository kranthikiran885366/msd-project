const rbacService = require("../services/rbacService")
const AccessControl = require("../models/AccessControl")
const AuditLog = require("../models/AuditLog")

// Role Management
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body
    const { userId } = req

    const role = await rbacService.createRole(name, description, permissions)

    await AuditLog.create({
      userId,
      action: "ROLE_CREATED",
      resourceType: "Role",
      resourceId: role._id,
      metadata: { roleName: name },
    })

    res.status(201).json(role)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listRoles = async (req, res) => {
  try {
    const roles = await rbacService.getAllRoles()
    res.json(roles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getRole = async (req, res) => {
  try {
    const { roleId } = req.params
    const role = await rbacService.getRoleById(roleId)

    if (!role) {
      return res.status(404).json({ error: "Role not found" })
    }

    res.json(role)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateRole = async (req, res) => {
  try {
    const { roleId } = req.params
    const { name, description, permissions } = req.body
    const { userId } = req

    const role = await rbacService.updateRole(roleId, { name, description, permissions })

    await AuditLog.create({
      userId,
      action: "ROLE_UPDATED",
      resourceType: "Role",
      resourceId: roleId,
      metadata: { changes: { name, description, permissions } },
    })

    res.json(role)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params
    const { userId } = req

    await rbacService.deleteRole(roleId)

    await AuditLog.create({
      userId,
      action: "ROLE_DELETED",
      resourceType: "Role",
      resourceId: roleId,
      metadata: {},
    })

    res.json({ message: "Role deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Permission Management
exports.createPermission = async (req, res) => {
  try {
    const { name, description, resource, action } = req.body
    const { userId } = req

    const permission = await rbacService.createPermission(name, description, resource, action)

    await AuditLog.create({
      userId,
      action: "PERMISSION_CREATED",
      resourceType: "Permission",
      resourceId: permission._id,
      metadata: { permissionName: name },
    })

    res.status(201).json(permission)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listPermissions = async (req, res) => {
  try {
    const permissions = await rbacService.getAllPermissions()
    res.json(permissions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// User Role Assignment
exports.assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.params
    const { projectId } = req.body
    const { userId: adminId } = req

    const access = await rbacService.assignRoleToUser(userId, roleId, projectId)

    await AuditLog.create({
      userId: adminId,
      action: "USER_ROLE_ASSIGNED",
      resourceType: "User",
      resourceId: userId,
      metadata: { roleId, projectId },
    })

    res.status(201).json(access)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.removeRoleFromUser = async (req, res) => {
  try {
    const { userId, roleId } = req.params
    const { adminId } = req

    await rbacService.removeRoleFromUser(userId, roleId)

    await AuditLog.create({
      userId: adminId,
      action: "USER_ROLE_REMOVED",
      resourceType: "User",
      resourceId: userId,
      metadata: { roleId },
    })

    res.json({ message: "Role removed successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Access Control
exports.checkPermission = async (req, res) => {
  try {
    const { userId, resource, action } = req.body

    const hasPermission = await rbacService.checkPermission(userId, resource, action)

    res.json({ hasPermission })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params

    const permissions = await rbacService.getUserPermissions(userId)

    res.json(permissions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getUserRoles = async (req, res) => {
  try {
    const { userId } = req.params

    const roles = await rbacService.getUserRoles(userId)

    res.json(roles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Audit Logs
exports.listAuditLogs = async (req, res) => {
  try {
    const { userId, action, resourceType, limit = 50, skip = 0 } = req.query

    const query = {}
    if (userId) query.userId = userId
    if (action) query.action = action
    if (resourceType) query.resourceType = resourceType

    const logs = await AuditLog.find(query).limit(parseInt(limit)).skip(parseInt(skip)).sort({ createdAt: -1 })

    const total = await AuditLog.countDocuments(query)

    res.json({ logs, total })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAuditLog = async (req, res) => {
  try {
    const { logId } = req.params

    const log = await AuditLog.findById(logId)

    if (!log) {
      return res.status(404).json({ error: "Audit log not found" })
    }

    res.json(log)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteAuditLogs = async (req, res) => {
  try {
    const { before } = req.body // Delete logs before a certain date

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: new Date(before) },
    })

    res.json({ deletedCount: result.deletedCount })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Access Control Policies
exports.listAccessPolicies = async (req, res) => {
  try {
    const { projectId } = req.query

    const query = projectId ? { projectId } : {}

    const policies = await AccessControl.find(query)

    res.json(policies)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.createAccessPolicy = async (req, res) => {
  try {
    const { userId, resource, action, projectId } = req.body
    const { userId: adminId } = req

    const policy = await AccessControl.create({
      userId,
      resource,
      action,
      projectId,
    })

    await AuditLog.create({
      userId: adminId,
      action: "ACCESS_POLICY_CREATED",
      resourceType: "AccessPolicy",
      resourceId: policy._id,
      metadata: { userId, resource, action },
    })

    res.status(201).json(policy)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteAccessPolicy = async (req, res) => {
  try {
    const { policyId } = req.params
    const { userId: adminId } = req

    await AccessControl.findByIdAndDelete(policyId)

    await AuditLog.create({
      userId: adminId,
      action: "ACCESS_POLICY_DELETED",
      resourceType: "AccessPolicy",
      resourceId: policyId,
      metadata: {},
    })

    res.json({ message: "Access policy deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Audit Log Archival
exports.archiveAuditLogs = async (req, res) => {
  try {
    const { before } = req.body
    const { userId } = req

    // Archive logs older than specified date
    const logs = await AuditLog.find({
      createdAt: { $lt: new Date(before) },
    })

    // In production, save to external storage (S3, etc.)
    const archived = {
      count: logs.length,
      archivedAt: new Date(),
      period: { before },
    }

    await AuditLog.create({
      userId,
      action: "AUDIT_LOGS_ARCHIVED",
      resourceType: "AuditLog",
      resourceId: null,
      metadata: archived,
    })

    res.json(archived)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
