const express = require("express")
const router = express.Router()
const apiTokenController = require("../controllers/apiTokenController")
const authMiddleware = require("../middleware/auth")

// API Tokens
router.post("/", authMiddleware, apiTokenController.createToken)
router.get("/", authMiddleware, apiTokenController.listTokens)
router.get("/:tokenId", authMiddleware, apiTokenController.getToken)
router.patch("/:tokenId/rotate", authMiddleware, apiTokenController.rotateToken)
router.delete("/:tokenId", authMiddleware, apiTokenController.revokeToken)
router.delete("/:tokenId/delete", authMiddleware, apiTokenController.deleteToken)

// Token usage and stats
router.get("/:tokenId/usage", authMiddleware, apiTokenController.getTokenUsage)
router.get("/stats/:projectId", authMiddleware, apiTokenController.getTokenStats)

// Validation
router.post("/validate", authMiddleware, apiTokenController.validateToken)

module.exports = router
