// Function Routes
const express = require("express")
const router = express.Router()
const functionController = require("../controllers/functionController")
const authMiddleware = require("../middleware/auth")

router.post("/project/:projectId", authMiddleware, functionController.createFunction)
router.get("/project/:projectId", authMiddleware, functionController.getFunctions)
router.get("/:id/metrics", authMiddleware, functionController.getFunctionMetrics)
router.get("/:id", authMiddleware, functionController.getFunctionById)
router.patch("/:id/toggle", authMiddleware, functionController.toggleFunction)
router.patch("/:id", authMiddleware, functionController.updateFunction)
router.delete("/:id", authMiddleware, functionController.deleteFunction)
router.post("/:id/invoke", authMiddleware, functionController.invokeFunction)

module.exports = router
