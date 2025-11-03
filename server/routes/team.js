// Team Routes - Enhanced
const express = require("express")
const router = express.Router()
const teamController = require("../controllers/teamController")
const authMiddleware = require("../middleware/auth")

// Debug: Check if functions exist
console.log('teamController.createMember:', typeof teamController.createMember)
console.log('authMiddleware:', typeof authMiddleware)

// Team members
router.post("/members", authMiddleware, teamController.createMember)
router.get("/project/:projectId", authMiddleware, teamController.listMembers)
router.get("/:memberId", authMiddleware, teamController.getMember)
router.patch("/:memberId/role", authMiddleware, teamController.updateMemberRole)
router.delete("/:memberId", authMiddleware, teamController.removeMember)

// Invitations
router.post("/invitations", authMiddleware, teamController.sendInvitation)
router.get("/invitations/pending/:projectId", authMiddleware, teamController.listInvitations)
router.get("/invitations/:invitationId", authMiddleware, teamController.getInvitation)
router.post("/invitations/:invitationId/accept", authMiddleware, teamController.acceptInvitation)
router.post("/invitations/:invitationId/decline", authMiddleware, teamController.declineInvitation)
router.post("/invitations/:invitationId/resend", authMiddleware, teamController.resendInvitation)
router.post("/invitations/:invitationId/revoke", authMiddleware, teamController.revokeInvitation)

// Activity logs
router.get("/activity-logs", authMiddleware, teamController.getActivityLogs)
router.get("/user-activity", authMiddleware, teamController.getUserActivity)

// Team settings
router.get("/:projectId/settings", authMiddleware, teamController.getTeamSettings)
router.patch("/:projectId/settings", authMiddleware, teamController.updateTeamSettings)

// Member permissions and stats
router.get("/:memberId/permissions", authMiddleware, teamController.getMemberPermissions)
router.get("/:projectId/stats", authMiddleware, teamController.getTeamStats)
router.get("/:projectId/roles", authMiddleware, teamController.listTeamRoles)

// Bulk operations
router.post("/bulk/add", authMiddleware, teamController.bulkAddMembers)
router.post("/bulk/remove", authMiddleware, teamController.bulkRemoveMembers)

module.exports = router
