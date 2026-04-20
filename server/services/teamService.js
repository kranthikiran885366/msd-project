// Team Management Service - Enhanced
const Team = require("../models/Team")
const User = require("../models/User")
const Invitation = require("../models/Invitation")
const AuditLog = require("../models/AuditLog")
const crypto = require("crypto")
let notificationService
try {
  notificationService = require('./notificationService')
} catch (e) {
  notificationService = null
}

class TeamService {
  _normalizeRole(role = "developer") {
    const normalized = String(role).toLowerCase()
    if (["owner", "admin", "developer", "viewer"].includes(normalized)) return normalized
    if (normalized === "member") return "developer"
    if (normalized === "manager") return "admin"
    return "developer"
  }

  _permissionsForRole(role) {
    const map = {
      owner: ["projects:*", "deployments:*", "team:*", "billing:*", "settings:*"] ,
      admin: ["projects:*", "deployments:*", "team:*", "billing:read", "settings:read"],
      developer: ["projects:read", "projects:update", "deployments:*", "team:read"],
      viewer: ["projects:read", "deployments:read", "team:read"],
    }
    return map[role] || map.developer
  }

  async inviteMember(projectId, email, role = "developer") {
    const inviteToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const teamMember = new Team({
      projectId,
      email,
      role,
      status: "pending",
      inviteToken,
      inviteExpiresAt: expiresAt,
      isActive: true,
    })

    await teamMember.save()

    // Send invitation notification if notificationService is available
    try {
      if (notificationService && teamMember.email) {
        await notificationService.sendEmail(teamMember.email, 'team_invitation', { teamName: projectId, inviteToken })
      }
    } catch (e) {
      // swallow errors - invitation still created
    }

    return {
      ...teamMember.toObject(),
      inviteToken,
    }
  }

  async getTeamMembers(projectId, options = {}) {
    const { limit = 50, offset = 0 } = options
    const members = await Team.find({
      projectId,
      status: "accepted",
      isActive: true,
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)

    const total = await Team.countDocuments({
      projectId,
      status: "accepted",
      isActive: true,
    })

    return { members, total, limit, offset }
  }

  async addTeamMember(projectId, userId, role = "developer") {
    const user = await User.findById(userId)
    if (!user) throw new Error("User not found")

    const normalizedRole = this._normalizeRole(role)
    let member = await Team.findOne({ projectId, userId })

    if (!member) {
      member = new Team({
        projectId,
        userId,
        email: user.email,
        role: normalizedRole,
        status: "accepted",
        acceptedAt: new Date(),
        isActive: true,
      })
    } else {
      member.role = normalizedRole
      member.status = "accepted"
      member.acceptedAt = member.acceptedAt || new Date()
      member.isActive = true
      member.email = user.email
    }

    await member.save()
    return await Team.findById(member._id).populate("userId", "name email")
  }

  async getTeamMemberById(id, projectId) {
    return await Team.findOne({
      _id: id,
      projectId,
      isActive: true,
    }).populate("userId", "name email")
  }

  async updateMemberRole(id, projectIdOrRole, maybeRole) {
    const isThreeArgCall = maybeRole !== undefined
    const projectId = isThreeArgCall ? projectIdOrRole : null
    const role = isThreeArgCall ? maybeRole : projectIdOrRole

    const query = {
      _id: id,
      isActive: true,
    }
    if (projectId) query.projectId = projectId

    const member = await Team.findOne(query)

    if (!member) throw new Error("Team member not found")

    member.activityLogs = member.activityLogs || []
    member.activityLogs.push({
      action: "role_changed",
      details: { from: member.role, to: role },
      timestamp: new Date(),
    })

    member.role = this._normalizeRole(role)
    await member.save()

    return member
  }

  async acceptInvite(projectId, inviteToken, userId) {
    const member = await Team.findOne({
      projectId,
      inviteToken,
      status: "pending",
      isActive: true,
    })

    if (!member) throw new Error("Invalid or expired invitation")

    member.userId = userId
    member.status = "accepted"
    member.acceptedAt = new Date()
    member.inviteToken = null

    await member.save()
    return member
  }

  async removeMember(id, projectId) {
    const member = await Team.findOne({
      _id: id,
      projectId,
      isActive: true,
    })

    if (!member) throw new Error("Team member not found")

    member.isActive = false
    await member.save()

    return member
  }

  async removeTeamMember(memberId) {
    const member = await Team.findById(memberId)
    if (!member) throw new Error("Team member not found")

    member.isActive = false
    member.status = member.status === "pending" ? "rejected" : member.status
    await member.save()
    return member
  }

  async getActivityLog(projectId, { limit = 100, offset = 0, days = 30 }) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const members = await Team.find({
      projectId,
      "activityLogs.timestamp": { $gte: startDate },
      isActive: true,
    })

    const logs = []
    members.forEach((member) => {
      (member.activityLogs || []).forEach((log) => {
        if (log.timestamp >= startDate) {
          logs.push({
            ...log,
            memberEmail: member.email,
            memberId: member._id,
          })
        }
      })
    })

    return {
      logs: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(offset, offset + limit),
      total: logs.length,
      limit,
      offset,
    }
  }

  async getPendingInvitations(projectId) {
    return await Team.find({
      projectId,
      status: "pending",
      isActive: true,
    }).sort({ createdAt: -1 })
  }

  async sendInvitation(projectId, email, role = "developer", invitedBy) {
    const normalizedRole = this._normalizeRole(role)
    const existing = await Invitation.findOne({
      projectId,
      email: String(email).toLowerCase(),
      status: "pending",
      expiresAt: { $gt: new Date() },
    })

    if (existing) return existing

    const invitation = await Invitation.create({
      projectId,
      email: String(email).toLowerCase(),
      role: normalizedRole === "owner" ? "admin" : normalizedRole,
      status: "pending",
      token: crypto.randomBytes(32).toString("hex"),
      invitedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    try {
      if (notificationService && invitation.email) {
        await notificationService.sendEmail(invitation.email, "team_invitation", {
          teamName: projectId,
          inviteToken: invitation.token,
        })
      }
    } catch (_) {
      // Invitation creation should not fail on email errors.
    }

    return invitation
  }

  async acceptInvitation(invitationId, userId) {
    const invitation = await Invitation.findById(invitationId)
    if (!invitation) throw new Error("Invitation not found")
    if (invitation.status !== "pending") throw new Error("Invitation already processed")
    if (invitation.expiresAt && invitation.expiresAt < new Date()) throw new Error("Invitation expired")

    invitation.status = "accepted"
    invitation.acceptedBy = userId
    await invitation.save()

    return await this.addTeamMember(invitation.projectId, userId, invitation.role)
  }

  async declineInvitation(invitationId) {
    const invitation = await Invitation.findById(invitationId)
    if (!invitation) throw new Error("Invitation not found")

    invitation.status = "declined"
    await invitation.save()
    return invitation
  }

  async resendInvitation(invitationId) {
    const invitation = await Invitation.findById(invitationId)
    if (!invitation) throw new Error("Invitation not found")
    if (invitation.status !== "pending") throw new Error("Only pending invitations can be resent")

    invitation.token = crypto.randomBytes(32).toString("hex")
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await invitation.save()

    try {
      if (notificationService && invitation.email) {
        await notificationService.sendEmail(invitation.email, "team_invitation", {
          teamName: invitation.projectId,
          inviteToken: invitation.token,
        })
      }
    } catch (_) {
      // Keep resend successful even if email delivery fails.
    }

    return invitation
  }

  async revokeInvitation(invitationId) {
    const invitation = await Invitation.findById(invitationId)
    if (!invitation) throw new Error("Invitation not found")

    invitation.status = "revoked"
    await invitation.save()
    return invitation
  }

  async getActivityLogs(projectId, limit = 50, skip = 0) {
    const query = {}
    if (projectId) query["metadata.projectId"] = String(projectId)

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    return logs
  }

  async getTeamSettings(projectId) {
    const members = await Team.find({ projectId, isActive: true }).select("role status")
    return {
      projectId,
      allowInvites: true,
      requireMfa: false,
      defaultRole: "developer",
      activeMembers: members.filter((m) => m.status === "accepted").length,
      pendingInvites: members.filter((m) => m.status === "pending").length,
    }
  }

  async updateTeamSettings(projectId, settings = {}) {
    const current = await this.getTeamSettings(projectId)
    return {
      ...current,
      ...settings,
      projectId,
      updatedAt: new Date(),
    }
  }

  async getMemberPermissions(memberId) {
    const member = await Team.findById(memberId).select("role")
    if (!member) throw new Error("Team member not found")

    return {
      role: member.role,
      permissions: this._permissionsForRole(member.role),
    }
  }

  async getTeamStatistics(projectId) {
    const members = await Team.find({ projectId, isActive: true }).select("role status createdAt")
    const accepted = members.filter((m) => m.status === "accepted")
    const pending = members.filter((m) => m.status === "pending")

    const roleBreakdown = accepted.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1
      return acc
    }, {})

    return {
      totalMembers: accepted.length,
      pendingInvitations: pending.length,
      roles: roleBreakdown,
      recentlyJoined: accepted.filter((m) => (Date.now() - new Date(m.createdAt).getTime()) <= 30 * 24 * 60 * 60 * 1000).length,
    }
  }

  async getTeamRoles(projectId) {
    const acceptedMembers = await Team.find({ projectId, isActive: true, status: "accepted" }).select("role")
    const counts = acceptedMembers.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1
      return acc
    }, {})

    const roleOrder = ["owner", "admin", "developer", "viewer"]
    return roleOrder.map((name) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      description: `${name.charAt(0).toUpperCase() + name.slice(1)} role`,
      type: "default",
      memberCount: counts[name] || 0,
      permissions: this._permissionsForRole(name),
      createdAt: null,
    }))
  }

  async bulkAddMembers(projectId, members = []) {
    const results = []
    for (const member of members) {
      if (member.userId) {
        results.push(await this.addTeamMember(projectId, member.userId, member.role))
      } else if (member.email) {
        results.push(await this.sendInvitation(projectId, member.email, member.role, member.invitedBy || member.userId))
      }
    }
    return results
  }

  async bulkRemoveMembers(memberIds = []) {
    const result = await Team.updateMany(
      { _id: { $in: memberIds } },
      { $set: { isActive: false } },
    )

    return { deletedCount: result.modifiedCount || result.nModified || 0 }
  }
}

module.exports = new TeamService()
