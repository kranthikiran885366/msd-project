const express = require("express")
const router = express.Router()
const blueprintController = require("../controllers/blueprintController")
const authMiddleware = require("../middleware/auth")

router.get("/project/:projectId", authMiddleware, blueprintController.listBlueprints)
router.post("/project/:projectId", authMiddleware, blueprintController.createBlueprint)
router.put("/:id", authMiddleware, blueprintController.updateBlueprint)
router.delete("/:id", authMiddleware, blueprintController.deleteBlueprint)
router.get("/:id/generate", authMiddleware, blueprintController.generateDeploymentConfig)
router.post("/:id/deploy", authMiddleware, blueprintController.deployBlueprint)

module.exports = router