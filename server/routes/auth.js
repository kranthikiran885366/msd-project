const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const { authenticate } = require("../middleware/auth")
const passport = require("passport")

// Public routes (no auth required)
router.post("/signup", authController.signup)
router.post("/login", authController.login)
router.post("/forgot-password", authController.forgotPassword)
router.post("/reset-password", authController.resetPassword)
router.get("/refresh-token", authController.refreshToken)

// Protected routes (auth required)
router.post("/logout", authenticate, authController.logout)
router.get("/profile", authenticate, authController.me)
router.put("/profile", authenticate, authController.updateProfile)
router.post("/change-password", authenticate, authController.changePassword)

// OAuth routes (Passport strategies)
router.get("/github", passport.authenticate("github", { scope: ["user:email", "repo", "read:user"] }))
router.get("/github/callback", passport.authenticate("github", { failureRedirect: "/login" }), authController.githubCallback)

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), authController.googleCallback)

module.exports = router
