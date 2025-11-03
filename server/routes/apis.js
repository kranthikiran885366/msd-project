const express = require("express")
const router = express.Router()
const apiController = require("../controllers/apiController")
const authMiddleware = require("../middleware/auth")

router.get("/project/:projectId", authMiddleware, apiController.listApis)
router.post("/project/:projectId", authMiddleware, apiController.createApi)
router.put("/:id", authMiddleware, apiController.updateApi)
router.delete("/:id", authMiddleware, apiController.deleteApi)
router.post("/test-endpoint", authMiddleware, apiController.testEndpoint)
router.get("/:id/docs", authMiddleware, apiController.generateApiDocs)

module.exports = router