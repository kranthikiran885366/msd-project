// Environment Variables Routes
const express = require("express")
const router = express.Router()
const environmentController = require("../controllers/environmentController")
const authMiddleware = require("../middleware/auth")

router.post("/project/:projectId", authMiddleware, environmentController.createEnvironment)
router.get("/project/:projectId", authMiddleware, environmentController.getEnvironments)
router.patch("/:id", authMiddleware, environmentController.updateEnvironment)
router.delete("/:id", authMiddleware, environmentController.deleteEnvironment)

module.exports = router
