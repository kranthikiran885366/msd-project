/**
 * Providers Routes
 * Handles provider connections, deployments, and webhooks
 */

const express = require("express")
const router = express.Router()
const providersController = require("../controllers/providersController")
const authMiddleware = require("../middleware/auth")

// Public: Get supported providers
router.get("/list", providersController.getSupportedProviders)

// Protected: Connect provider account
router.post(
  "/connect",
  authMiddleware,
  providersController.connectProvider
)

// Protected: Disconnect provider account
router.delete(
  "/:provider/disconnect",
  authMiddleware,
  providersController.disconnectProvider
)

// Protected: Start deployment with provider
router.post(
  "/deploy",
  authMiddleware,
  providersController.startDeployment
)

// Protected: Get deployment status
router.get(
  "/deployments/:deploymentId/status",
  authMiddleware,
  providersController.getDeploymentStatus
)

// Protected: Get deployment logs
router.get(
  "/deployments/:deploymentId/logs",
  authMiddleware,
  providersController.getDeploymentLogs
)

// Protected: Cancel deployment
router.post(
  "/deployments/:deploymentId/cancel",
  authMiddleware,
  providersController.cancelDeployment
)

// Webhooks (no auth required, signature validated)
router.post(
  "/webhooks/:provider",
  providersController.handleWebhook
)

module.exports = router
