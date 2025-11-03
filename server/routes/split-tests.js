const express = require("express")
const router = express.Router()
const splitTestController = require("../controllers/splitTestController")
const authMiddleware = require("../middleware/auth")

// Test management routes (protected)
router.get("/project/:projectId", authMiddleware, splitTestController.listTests)
router.post("/project/:projectId", authMiddleware, splitTestController.createTest)
router.put("/:id", authMiddleware, splitTestController.updateTest)
router.delete("/:id", authMiddleware, splitTestController.deleteTest)
router.patch("/:testId/variants/:variantName", authMiddleware, splitTestController.updateVariantWeight)
router.get("/:id/metrics", authMiddleware, splitTestController.getTestMetrics)

// Visitor routing (public)
router.post("/:testId/visit", splitTestController.handleVisit)
router.post("/:testId/conversion", splitTestController.recordConversion)

module.exports = router