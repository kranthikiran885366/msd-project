// Cron Jobs Routes
const express = require("express")
const router = express.Router()
const cronJobController = require("../controllers/cronJobController")
const authMiddleware = require("../middleware/auth")

router.post("/project/:projectId", authMiddleware, cronJobController.createCronJob)
router.get("/project/:projectId", authMiddleware, cronJobController.getCronJobs)
router.patch("/:id", authMiddleware, cronJobController.updateCronJob)
router.delete("/:id", authMiddleware, cronJobController.deleteCronJob)
router.post("/:id/run", authMiddleware, cronJobController.runCronJob)

module.exports = router
