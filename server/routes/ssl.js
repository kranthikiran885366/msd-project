// SSL Routes
const express = require("express")
const router = express.Router()
const sslController = require("../controllers/sslController")
const authMiddleware = require("../middleware/auth")

router.get("/certificates", authMiddleware, sslController.getSSLCertificates)
router.post("/certificates", authMiddleware, sslController.getUploadMiddleware(), sslController.uploadSSLCertificate)
router.get("/certificates/:id", authMiddleware, sslController.getSSLCertificateById)
router.delete("/certificates/:id", authMiddleware, sslController.deleteSSLCertificate)
router.post("/certificates/:id/renew", authMiddleware, sslController.renewSSLCertificate)

module.exports = router