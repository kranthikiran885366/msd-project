// Logs Routes
const express = require("express")
const router = express.Router()
const logController = require("../controllers/logController")
const authMiddleware = require("../middleware/auth")

router.get("/project/:projectId", authMiddleware, logController.getLogs)
router.get("/project/:projectId/stats", authMiddleware, logController.getLogStats)
router.delete("/project/:projectId", authMiddleware, logController.clearLogs)

module.exports = router
