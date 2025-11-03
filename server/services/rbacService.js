const Role = require("../models/Role")
const { AccessControl, AuditLog } = require("../models/AccessControl")

class RBACService {
  async createRole(projectId, name, permissions, description) {
    const role = new Role({
      projectId,
      name,
      permissions,
      description,
      isCustom: true,
    })
    return await role.save()
  }

  async assignRoleToUser(projectId, userId, roleId) {
    const role = await Role.findById(roleId)
    if (!role || role.projectId.toString() !== projectId) {
      throw new Error("Role not found")
    }

    const accessControl = new AccessControl({
      projectId,
      userId,
      roleId,
      resource: "all",
      grantedAt: new Date(),
    })

    const saved = await accessControl.save()

    // Increment user count
    role.userCount = (role.userCount || 0) + 1
    await role.save()

    return saved
  }

  async checkPermission(userId, projectId, resource, action) {
    const accessControl = await AccessControl.findOne({
      projectId,
      userId,
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    }).populate("roleId")

    if (!accessControl) {
      return false
    }

    const role = accessControl.roleId
    const permission = role.permissions.find((p) => p.resource === resource)

    if (!permission) {
      return false
    }

    return permission.actions.includes(action)
  }

  async updateRolePermissions(roleId, permissions) {
    const role = await Role.findByIdAndUpdate(
      roleId,
      { permissions },
      { new: true, runValidators: true }
    )
    return role
  }

  async listUserRoles(projectId, userId) {
    const roles = await AccessControl.find({
      projectId,
      userId,
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    }).populate("roleId")

    return roles.map((ac) => ac.roleId)
  }

  async removeUserRole(projectId, userId, roleId) {
    const result = await AccessControl.findOneAndUpdate(
      { projectId, userId, roleId },
      { isActive: false },
      { new: true }
    )

    if (result) {
      const role = await Role.findById(roleId)
      if (role) {
        role.userCount = Math.max(0, (role.userCount || 0) - 1)
        await role.save()
      }
    }

    return result
  }

  async auditAccessLog(projectId, userId, action, resource, resourceId, granted, ipAddress, userAgent, details) {
    const log = new AuditLog({
      projectId,
      userId,
      action,
      resource,
      resourceId,
      granted,
      ipAddress,
      userAgent,
      details,
      timestamp: new Date(),
    })
    return await log.save()
  }

  async getAuditLogs(projectId, { limit = 50, offset = 0, userId, action, resource }) {
    const query = { projectId }
    if (userId) query.userId = userId
    if (action) query.action = action
    if (resource) query.resource = resource

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .populate("userId", "name email")

    const total = await AuditLog.countDocuments(query)

    return { logs, total, limit, offset }
  }

  async updateRoleUserCount(roleId) {
    const count = await AccessControl.countDocuments({
      roleId,
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    })

    await Role.findByIdAndUpdate(roleId, { userCount: count })
    return count
  }

  async grantPermission(projectId, userId, resource, actions) {
    const role = await Role.findOne({ projectId, name: `custom_${userId}` })

    if (!role) {
      const newRole = await this.createRole(projectId, `custom_${userId}`, [{ resource, actions }])
      return await this.assignRoleToUser(projectId, userId, newRole._id)
    }

    const permissionIndex = role.permissions.findIndex((p) => p.resource === resource)
    if (permissionIndex >= 0) {
      role.permissions[permissionIndex].actions = [
        ...new Set([...role.permissions[permissionIndex].actions, ...actions]),
      ]
    } else {
      role.permissions.push({ resource, actions })
    }

    await role.save()
    return role
  }

  async revokePermission(projectId, userId, resource, actions) {
    const role = await Role.findOne({ projectId, name: `custom_${userId}` })

    if (!role) {
      throw new Error("No custom role found for user")
    }

    const permission = role.permissions.find((p) => p.resource === resource)
    if (permission) {
      permission.actions = permission.actions.filter((a) => !actions.includes(a))
      if (permission.actions.length === 0) {
        role.permissions = role.permissions.filter((p) => p.resource !== resource)
      }
    }

    await role.save()
    return role
  }

  async listRoles(projectId, { limit = 50, offset = 0, isActive = true }) {
    const roles = await Role.find({ projectId, isActive })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)

    const total = await Role.countDocuments({ projectId, isActive })

    return { roles, total, limit, offset }
  }

  async deleteRole(roleId) {
    const role = await Role.findByIdAndUpdate(roleId, { isActive: false }, { new: true })
    return role
  }
}

module.exports = new RBACService()
