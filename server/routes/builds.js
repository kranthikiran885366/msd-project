// Build Routes - comprehensive routes for build management
const express = require("express")
const router = express.Router()
const buildController = require("../controllers/buildController")
const authMiddleware = require("../middleware/auth")

// Create and list builds
router.post("/:projectId", authMiddleware, buildController.createBuild)
router.get("/:projectId", authMiddleware, buildController.getBuildsByProject)

// Individual build operations
router.get("/:projectId/:id", authMiddleware, buildController.getBuildById)
router.patch("/:projectId/:id/status", authMiddleware, buildController.updateBuildStatus)

// Build logs and steps
router.post("/:projectId/:buildId/logs", authMiddleware, buildController.addBuildLog)
router.get("/:projectId/:buildId/logs", authMiddleware, buildController.getBuildLogs)

router.post("/:projectId/:buildId/steps", authMiddleware, buildController.addBuildStep)
router.patch("/:projectId/:buildId/steps/:stepName", authMiddleware, buildController.updateBuildStep)

// Build hooks
router.post("/:projectId/:buildId/hooks/execute", authMiddleware, buildController.executeBuildHooks)

// Build management
router.post("/:projectId/:buildId/retry", authMiddleware, buildController.retryBuild)
router.post("/:projectId/:buildId/cancel", authMiddleware, buildController.cancelBuild)

// Build metrics and analytics
router.get("/:projectId/:buildId/metrics", authMiddleware, buildController.getBuildMetrics)
router.get("/:projectId/analytics", authMiddleware, buildController.getBuildAnalytics)

// Cache management
router.get("/:projectId/cache", authMiddleware, buildController.getCacheSummary)
router.post("/cache-key", authMiddleware, buildController.generateCacheKey)

module.exports = router
