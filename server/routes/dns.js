// DNS Routes
const express = require("express")
const router = express.Router()
const dnsController = require("../controllers/dnsController")
const authMiddleware = require("../middleware/auth")

router.get("/records", authMiddleware, dnsController.getDNSRecords)
router.post("/records", authMiddleware, dnsController.addDNSRecord)
router.get("/records/:id", authMiddleware, dnsController.getDNSRecordById)
router.patch("/records/:id", authMiddleware, dnsController.updateDNSRecord)
router.delete("/records/:id", authMiddleware, dnsController.deleteDNSRecord)

module.exports = router