const express = require("express")
const authController = require("../controllers/authController")
const authMiddleware = require("../middleware/auth")
const passport = require("passport")

const router = express.Router()

// Local Authentication
router.post("/signup", authController.signup)
router.post("/login", authController.login)
router.post("/logout", authMiddleware, authController.logout)
router.post("/refresh", authController.refreshToken)

// Password Management
router.post("/forgot-password", authController.forgotPassword)
router.post("/reset-password", authController.resetPassword)

// Profile Management
router.get("/me", authMiddleware, authController.me)
router.put("/profile", authMiddleware, authController.updateProfile)
router.post("/change-password", authMiddleware, authController.changePassword)

// Error handling for OAuth
router.get("/error", (req, res) => {
  const error = req.query.message || "Authentication failed"
  res.status(401).json({ 
    error: "Authentication Failed",
    message: error,
    code: "AUTH_FAILED"
  })
})

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)

router.get(
  "/google/callback",
  passport.authenticate("google", { 
    session: false,
    failureRedirect: "/auth/error"
  }),
  authController.googleCallback
)

// GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
)

router.get(
  "/github/callback",
  passport.authenticate("github", { 
    session: false,
    failureRedirect: "/auth/error"
  }),
  authController.githubCallback
)

module.exports = router
