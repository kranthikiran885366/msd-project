const express = require("express")
const router = express.Router()
const securityController = require("../controllers/securityController")
const authMiddleware = require("../middleware/auth")

// Role management
router.post("/roles", authMiddleware, securityController.createRole)
router.get("/roles", authMiddleware, securityController.listRoles)
router.get("/roles/:roleId", authMiddleware, securityController.getRole)
router.patch("/roles/:roleId", authMiddleware, securityController.updateRole)
router.delete("/roles/:roleId", authMiddleware, securityController.deleteRole)

// Permission management
router.post("/permissions", authMiddleware, securityController.createPermission)
router.get("/permissions", authMiddleware, securityController.listPermissions)

// User role assignment
router.post("/users/:userId/roles/:roleId", authMiddleware, securityController.assignRoleToUser)
router.delete("/users/:userId/roles/:roleId", authMiddleware, securityController.removeRoleFromUser)
router.get("/users/:userId/roles", authMiddleware, securityController.getUserRoles)

// User permissions
router.get("/users/:userId/permissions", authMiddleware, securityController.getUserPermissions)

// Permission checking
router.post("/check-permission", authMiddleware, securityController.checkPermission)

// Access control policies
router.post("/access-policies", authMiddleware, securityController.createAccessPolicy)
router.get("/access-policies", authMiddleware, securityController.listAccessPolicies)
router.delete("/access-policies/:policyId", authMiddleware, securityController.deleteAccessPolicy)

// Audit logs
router.get("/audit-logs", authMiddleware, securityController.listAuditLogs)
router.get("/audit-logs/:logId", authMiddleware, securityController.getAuditLog)
router.post("/audit-logs/archive", authMiddleware, securityController.archiveAuditLogs)
router.delete("/audit-logs", authMiddleware, securityController.deleteAuditLogs)

module.exports = router
