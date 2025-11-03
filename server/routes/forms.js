const express = require("express")
const router = express.Router()
const formController = require("../controllers/formController")
const authMiddleware = require("../middleware/auth")
const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })

// Form management routes (protected)
router.get("/project/:projectId", authMiddleware, formController.listForms)
router.post("/project/:projectId", authMiddleware, formController.createForm)
router.put("/:id", authMiddleware, formController.updateForm)
router.delete("/:id", authMiddleware, formController.deleteForm)

// Form submission routes (public)
router.post("/:formId/submit", upload.array("files"), formController.handleSubmission)

// Submission management routes (protected)
router.get("/:formId/submissions", authMiddleware, formController.getSubmissions)
router.get("/:formId/export", authMiddleware, formController.exportSubmissions)

module.exports = router