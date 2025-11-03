// Team Management Service - Enhanced
const Team = require("../models/Team")
const User = require("../models/User")
const crypto = require("crypto")
let notificationService
try {
  notificationService = require('./notificationService')
} catch (e) {
  notificationService = null
}

class TeamService {
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

  async getTeamMembers(projectId, { limit = 50, offset = 0 }) {
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

  async getTeamMemberById(id, projectId) {
    return await Team.findOne({
      _id: id,
      projectId,
      isActive: true,
    }).populate("userId", "name email")
  }

  async updateMemberRole(id, projectId, role) {
    const member = await Team.findOne({
      _id: id,
      projectId,
      isActive: true,
    })

    if (!member) throw new Error("Team member not found")

    member.activityLogs = member.activityLogs || []
    member.activityLogs.push({
      action: "role_changed",
      details: { from: member.role, to: role },
      timestamp: new Date(),
    })

    member.role = role
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

  async resendInvitation(projectId, memberId) {
    const member = await Team.findOne({
      _id: memberId,
      projectId,
      status: "pending",
      isActive: true,
    })

    if (!member) throw new Error("Invitation not found")

    const inviteToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    member.inviteToken = inviteToken
    member.inviteExpiresAt = expiresAt

    await member.save()

    // Try to send notification
    try {
      if (notificationService && member.email) {
        await notificationService.sendEmail(member.email, 'team_invitation', { teamName: projectId, inviteToken })
      }
    } catch (e) {
      // ignore
    }

    return {
      inviteToken,
      expiresAt,
      email: member.email,
    }
  }
}

module.exports = new TeamService()
