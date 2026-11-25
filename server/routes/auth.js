const express = require("express")
const router = express.Router()
router.use(["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/email-verification/request"], require("express-rate-limit").rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }));
const authController = require("../controllers/authController")
const { authenticate } = require("../middleware/auth")
const passport = require("passport")

// Public routes (no auth required)
router.post("/signup", authController.signup)
router.post("/login", authController.login)
router.post("/forgot-password", authController.forgotPassword)
router.post("/reset-password", authController.resetPassword)
router.post("/refresh-token", authController.refreshToken)


router.post('/oauth-session', authController.exchangeOAuth);
router.post('/email-verification/request', authenticate, authController.requestEmailVerification);
router.post('/verify-email', authController.verifyEmail);
router.get('/providers', (req, res) => res.json({ github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET), google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) }));

// Protected routes (auth required)
router.post("/logout", authenticate, authController.logout)
router.get("/profile", authenticate, authController.me)
router.put("/profile", authenticate, authController.updateProfile)
router.post("/change-password", authenticate, authController.changePassword)

// OAuth routes (Passport strategies)
router.get("/github", (req, res, next) => {
  // Store return URL in session for post-auth redirect
  const returnUrl = req.query.returnUrl || req.get('referer');
  if (returnUrl) {
    req.session.githubReturnUrl = require('../utils/authRedirect').safeReturnPath(returnUrl, process.env.CLIENT_URL || 'http://localhost:5000');
  }
  passport.authenticate("github", { scope: ["user:email", "repo", "read:user"] })(req, res, next);
})

router.get("/github/callback", passport.authenticate("github", { failureRedirect: "/login" }), authController.githubCallback)

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), authController.googleCallback)

module.exports = router
