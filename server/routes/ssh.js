const express = require("express")
const router = express.Router()
const sshController = require("../controllers/sshController")
const authMiddleware = require("../middleware/auth")

// SSH Key management
router.get("/keys", authMiddleware, sshController.listKeys)
router.post("/keys", authMiddleware, sshController.addKey)
router.delete("/keys/:id", authMiddleware, sshController.deleteKey)

// SSH Connections
router.post("/connect/:serviceId", authMiddleware, sshController.connectToService)
router.post("/disconnect/:serviceId", authMiddleware, sshController.disconnectFromService)

module.exports = router