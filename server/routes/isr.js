const express = require("express")
const router = express.Router()
const isrController = require("../controllers/isrController")
const authMiddleware = require("../middleware/auth")

// ISR page management
router.get("/project/:projectId", authMiddleware, isrController.listPages)
router.post("/project/:projectId", authMiddleware, isrController.addPage)
router.patch("/:id", authMiddleware, isrController.updatePage)
router.delete("/:id", authMiddleware, isrController.deletePage)

// Revalidation endpoints
router.post("/:id/revalidate", authMiddleware, isrController.revalidatePage)
router.post("/:id/webhook", authMiddleware, isrController.setupWebhook)
router.post("/webhook/:id", isrController.handleWebhook)

// Analytics
router.get("/:id/analytics", authMiddleware, isrController.getAnalytics)

module.exports = router