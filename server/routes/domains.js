// Domains Routes
const express = require("express")
const router = express.Router()
const domainController = require("../controllers/domainController")
const redirectController = require("../controllers/redirectController")
const authMiddleware = require("../middleware/auth")

router.post("/project/:projectId", authMiddleware, domainController.createDomain)
router.get("/project/:projectId", authMiddleware, domainController.getDomains)
router.post("/:id/verify", authMiddleware, domainController.verifyDomain)
router.delete("/:id", authMiddleware, domainController.deleteDomain)

// Redirect routes
router.get("/redirects", authMiddleware, redirectController.getDomainRedirects)
router.post("/:domainId/redirects", authMiddleware, redirectController.addDomainRedirect)
router.get("/redirects/:id", authMiddleware, redirectController.getDomainRedirectById)
router.patch("/redirects/:id", authMiddleware, redirectController.updateDomainRedirect)
router.delete("/redirects/:id", authMiddleware, redirectController.deleteDomainRedirect)

module.exports = router
