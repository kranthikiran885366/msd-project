// Deployment Routes
const express = require("express")
const router = express.Router()
const deploymentController = require("../controllers/deploymentController")
const gitDeploymentController = require("../controllers/gitDeploymentController")
const authMiddleware = require("../middleware/auth")
const { features } = require("../middleware/features")

// Git repository configuration
router.post("/repository/:projectId",
  authMiddleware,
  gitDeploymentController.configureRepository
)

// Git webhooks
router.post("/webhooks/git/:provider/:projectId",
  gitDeploymentController.handleWebhook
)

// Preview deployments
router.post("/preview/:projectId",
  authMiddleware,
  gitDeploymentController.createPreviewDeploy
)

// Scheduled deployments
router.post("/schedule/:projectId",
  authMiddleware,
  gitDeploymentController.scheduleDeployment
)

// Deploy locks
router.post("/lock/:projectId",
  authMiddleware,
  gitDeploymentController.toggleDeployLock
)

// Build cache
router.get("/cache/check/:projectId",
  authMiddleware,
  deploymentController.getBuildCacheStatus
)

router.post("/cache/update/:projectId",
  authMiddleware,
  gitDeploymentController.updateBuildCache
)

// Regular deployment routes
router.post("/",
  authMiddleware,
  deploymentController.createDeployment
)

router.get("/",
  authMiddleware,
  deploymentController.getAllDeployments
)

router.get("/project/:projectId",
  authMiddleware,
  deploymentController.getDeployments
)

router.get("/analytics/project/:projectId",
  authMiddleware,
  deploymentController.getProjectDeploymentAnalytics
)

router.get("/:id",
  authMiddleware,
  deploymentController.getDeploymentById
)

router.get("/:id/metrics",
  authMiddleware,
  deploymentController.getDeploymentMetrics
)

router.patch("/:id/status",
  authMiddleware,
  deploymentController.updateDeploymentStatus
)

router.post("/:id/rollback",
  authMiddleware,
  deploymentController.rollbackDeployment
)

router.get("/:id/logs",
  authMiddleware,
  deploymentController.getDeploymentLogs
)

module.exports = router
