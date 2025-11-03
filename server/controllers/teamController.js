const teamService = require("../services/teamService")
const TeamMember = require("../models/Team")
const Invitation = require("../models/Invitation")
const AuditLog = require("../models/AuditLog")

// Team Members
exports.createMember = async (req, res) => {
  try {
    const { projectId, userId, role } = req.body
    const { userId: currentUserId } = req

    const member = await teamService.addTeamMember(projectId, userId, role)

    await AuditLog.create({
      userId: currentUserId,
      action: "TEAM_MEMBER_ADDED",
      resourceType: "TeamMember",
      resourceId: member._id,
      metadata: { projectId, userId, role },
    })

    res.status(201).json(member)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listMembers = async (req, res) => {
  try {
    const { projectId } = req.params

    const members = await teamService.getTeamMembers(projectId)

    res.json(members)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getMember = async (req, res) => {
  try {
    const { memberId } = req.params

    const member = await TeamMember.findById(memberId)

    if (!member) {
      return res.status(404).json({ error: "Team member not found" })
    }

    res.json(member)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateMemberRole = async (req, res) => {
  try {
    const { memberId } = req.params
    const { role } = req.body
    const { userId } = req

    const member = await teamService.updateMemberRole(memberId, role)

    await AuditLog.create({
      userId,
      action: "TEAM_MEMBER_ROLE_UPDATED",
      resourceType: "TeamMember",
      resourceId: memberId,
      metadata: { role },
    })

    res.json(member)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params
    const { userId } = req

    await teamService.removeTeamMember(memberId)

    await AuditLog.create({
      userId,
      action: "TEAM_MEMBER_REMOVED",
      resourceType: "TeamMember",
      resourceId: memberId,
      metadata: {},
    })

    res.json({ message: "Team member removed successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Invitations
exports.sendInvitation = async (req, res) => {
  try {
    const { projectId, email, role } = req.body
    const { userId } = req

    const invitation = await teamService.sendInvitation(projectId, email, role, userId)

    await AuditLog.create({
      userId,
      action: "TEAM_INVITATION_SENT",
      resourceType: "Invitation",
      resourceId: invitation._id,
      metadata: { projectId, email, role },
    })

    res.status(201).json(invitation)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listInvitations = async (req, res) => {
  try {
    const { projectId } = req.params

    const invitations = await Invitation.find({
      projectId,
      status: "pending",
    })

    res.json(invitations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params

    const invitation = await Invitation.findById(invitationId)

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" })
    }

    res.json(invitation)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params
    const { userId } = req

    const member = await teamService.acceptInvitation(invitationId, userId)

    await AuditLog.create({
      userId,
      action: "TEAM_INVITATION_ACCEPTED",
      resourceType: "Invitation",
      resourceId: invitationId,
      metadata: { memberId: member._id },
    })

    res.json(member)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.declineInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params
    const { userId } = req

    await teamService.declineInvitation(invitationId)

    await AuditLog.create({
      userId,
      action: "TEAM_INVITATION_DECLINED",
      resourceType: "Invitation",
      resourceId: invitationId,
      metadata: {},
    })

    res.json({ message: "Invitation declined" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params
    const { userId } = req

    const invitation = await teamService.resendInvitation(invitationId)

    await AuditLog.create({
      userId,
      action: "TEAM_INVITATION_RESENT",
      resourceType: "Invitation",
      resourceId: invitationId,
      metadata: {},
    })

    res.json(invitation)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.revokeInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params
    const { userId } = req

    await teamService.revokeInvitation(invitationId)

    await AuditLog.create({
      userId,
      action: "TEAM_INVITATION_REVOKED",
      resourceType: "Invitation",
      resourceId: invitationId,
      metadata: {},
    })

    res.json({ message: "Invitation revoked" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Activity Logs
exports.getActivityLogs = async (req, res) => {
  try {
    const { projectId, limit = 50, skip = 0 } = req.query

    const logs = await teamService.getActivityLogs(projectId, parseInt(limit), parseInt(skip))

    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getUserActivity = async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query

    const activity = await AuditLog.find({ userId })
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    res.json(activity)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Team Settings
exports.getTeamSettings = async (req, res) => {
  try {
    const { projectId } = req.params

    const settings = await teamService.getTeamSettings(projectId)

    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateTeamSettings = async (req, res) => {
  try {
    const { projectId } = req.params
    const { settings } = req.body
    const { userId } = req

    const updated = await teamService.updateTeamSettings(projectId, settings)

    await AuditLog.create({
      userId,
      action: "TEAM_SETTINGS_UPDATED",
      resourceType: "Team",
      resourceId: projectId,
      metadata: { settings },
    })

    res.json(updated)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Member Permissions
exports.getMemberPermissions = async (req, res) => {
  try {
    const { memberId } = req.params

    const permissions = await teamService.getMemberPermissions(memberId)

    res.json(permissions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Team Statistics
exports.getTeamStats = async (req, res) => {
  try {
    const { projectId } = req.params

    const stats = await teamService.getTeamStatistics(projectId)

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Team Roles
exports.listTeamRoles = async (req, res) => {
  try {
    const { projectId } = req.params

    const roles = await teamService.getTeamRoles(projectId)

    res.json(roles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Bulk Operations
exports.bulkAddMembers = async (req, res) => {
  try {
    const { projectId, members } = req.body
    const { userId } = req

    const results = await teamService.bulkAddMembers(projectId, members)

    await AuditLog.create({
      userId,
      action: "TEAM_MEMBERS_BULK_ADDED",
      resourceType: "Team",
      resourceId: projectId,
      metadata: { count: results.length },
    })

    res.status(201).json(results)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.bulkRemoveMembers = async (req, res) => {
  try {
    const { memberIds } = req.body
    const { userId } = req

    const results = await teamService.bulkRemoveMembers(memberIds)

    await AuditLog.create({
      userId,
      action: "TEAM_MEMBERS_BULK_REMOVED",
      resourceType: "Team",
      resourceId: null,
      metadata: { count: memberIds.length },
    })

    res.json({ deletedCount: results.deletedCount })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
