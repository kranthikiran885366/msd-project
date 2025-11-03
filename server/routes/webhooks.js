const express = require("express")
const router = express.Router()
const webhookController = require("../controllers/webhookController")
const authMiddleware = require("../middleware/auth")

// Webhooks
router.post("/", authMiddleware, webhookController.createWebhook)
router.get("/", authMiddleware, webhookController.listWebhooks)
router.get("/:webhookId", authMiddleware, webhookController.getWebhook)
router.patch("/:webhookId", authMiddleware, webhookController.updateWebhook)
router.delete("/:webhookId", authMiddleware, webhookController.deleteWebhook)

// Webhook testing and delivery
router.post("/:webhookId/test", authMiddleware, webhookController.testWebhook)
router.get("/:webhookId/deliveries", authMiddleware, webhookController.getDeliveries)
router.get("/:webhookId/deliveries/:deliveryId", authMiddleware, webhookController.getDelivery)
router.post("/:webhookId/deliveries/:deliveryId/retry", authMiddleware, webhookController.retryDelivery)

// Statistics
router.get("/:webhookId/statistics", authMiddleware, webhookController.getStatistics)
router.get("/project/:projectId/statistics", authMiddleware, webhookController.getProjectStatistics)

// Events
router.get("/events", authMiddleware, webhookController.listEvents)

// Bulk operations
router.post("/bulk/disable", authMiddleware, webhookController.bulkDisable)
router.post("/:webhookId/deliveries/clear", authMiddleware, webhookController.clearDeliveries)

module.exports = router
