const jwt = require("jsonwebtoken")
const User = require("../models/User")
const AuditLog = require("../models/AuditLog")
const AuthService = require("../services/authService")
const crypto = require("crypto")
const emailService = require("../utils/emailService")

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" })
}

// Local Authentication - Signup
exports.signup = async (req, res) => {
  try {
    const { email, password, confirmPassword, name } = req.body

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return res.status(409).json({ 
        error: "Email already registered. Please login or use social login to connect your accounts." 
      })
    }

    // Create new user with local provider
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      plan: "free",
      dbLimit: 1,
      dbProvider: "auto",
      emailVerified: false,
      verificationToken: crypto.randomBytes(20).toString("hex"),
      oauth: {
        google: {},
        github: {},
      },
    })

    await user.save()

    // Generate tokens
    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: "USER_SIGNED_UP",
      resourceType: "User",
      resourceId: user._id,
      metadata: { email, name },
    })

    res.status(201).json({
      message: "Signup successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        plan: user.plan,
        dbLimit: user.dbLimit,
        dbProvider: user.dbProvider,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Local Authentication - Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Find user and select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password")

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({ error: "Account is locked. Try again later." })
    }

    // Check if user has a password (might be OAuth-only user)
    if (!user.password) {
      return res.status(401).json({ error: "This account uses OAuth. Please sign in with GitHub or Google." })
    }

    // Compare passwords
    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
      await user.incLoginAttempts()
      return res.status(401).json({ error: "Invalid email or password" })
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts()

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate tokens
    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: "USER_LOGGED_IN",
      resourceType: "User",
      resourceId: user._id,
      metadata: { email },
    })

    res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        plan: user.plan,
        dbLimit: user.dbLimit,
        dbProvider: user.dbProvider,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Logout
exports.logout = async (req, res) => {
  try {
    const { userId } = req

    await AuditLog.create({
      userId,
      action: "USER_LOGGED_OUT",
      resourceType: "User",
      resourceId: userId,
      metadata: {},
    })

    res.json({ message: "Logout successful" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    const newToken = generateToken(user._id)

    res.json({ token: newToken })
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" })
  }
}

// Google OAuth Callback
exports.googleCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000"
  try {
    const { profile, refreshToken: googleRefreshToken } = req.user
    const { id, displayName, emails, photos } = profile

    const googleEmail = emails?.[0]?.value
    if (!googleEmail) throw new Error("Google account does not have an email address")

    const { user, isNewUser, isLinked } = await AuthService.findOrCreateUser(
      googleEmail,
      "google",
      {
        id,
        email: googleEmail,
        picture: photos?.[0]?.value,
        name: displayName,
        refreshToken: googleRefreshToken,
      }
    )

    const action = isNewUser ? "USER_SIGNED_UP_GOOGLE" : isLinked ? "USER_LINKED_GOOGLE" : "USER_LOGGED_IN_GOOGLE"
    await AuthService.createAuthAuditLog(user._id, action, { email: googleEmail })

    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    const redirectUrl = new URL(`${clientUrl}/login/auth-callback`)
    redirectUrl.searchParams.append("token", token)
    redirectUrl.searchParams.append("refreshToken", refreshToken)
    redirectUrl.searchParams.append("userId", user._id)
    redirectUrl.searchParams.append("email", user.email)
    redirectUrl.searchParams.append("name", user.name)
    redirectUrl.searchParams.append("avatar", user.avatar || "")
    redirectUrl.searchParams.append("isNew", isNewUser ? "true" : "false")
    redirectUrl.searchParams.append("isLinked", isLinked ? "true" : "false")
    res.redirect(redirectUrl.toString())
  } catch (error) {
    console.error("[auth] Google callback error:", error)
    res.redirect(`${clientUrl}/login/error?message=${encodeURIComponent(error.message)}`)
  }
}

// GitHub OAuth Callback
exports.githubCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000"
  try {
    const { profile, accessToken } = req.user
    const { id, displayName, username, photos, emails } = profile

    const githubEmail = emails?.[0]?.value

    const { user, isNewUser, isLinked } = await AuthService.findOrCreateUser(
      githubEmail || `${username}@github.local`,
      "github",
      {
        id,
        login: username,
        avatar_url: photos?.[0]?.value,
        name: displayName || username,
        accessToken,
        emailVerified: !!githubEmail,
      }
    )

    const action = isNewUser ? "USER_SIGNED_UP_GITHUB" : isLinked ? "USER_LINKED_GITHUB" : "USER_LOGGED_IN_GITHUB"
    await AuthService.createAuthAuditLog(user._id, action, { username })

    // Persist GitHub integration for repo access
    const GitHubIntegration = require("../models/GitHubIntegration")
    await GitHubIntegration.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, githubUsername: username, accessToken, connectedAt: new Date() },
      { upsert: true, new: true }
    )

    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Honour returnUrl from session (set in route handler)
    let returnUrl = req.session?.githubReturnUrl
    if (returnUrl) delete req.session.githubReturnUrl

    // Fallback: recover returnUrl from OAuth state when session is unavailable.
    if (!returnUrl && req.query?.state) {
      try {
        const decodedState = JSON.parse(Buffer.from(String(req.query.state), 'base64').toString('utf8'))
        if (decodedState?.returnUrl && typeof decodedState.returnUrl === 'string') {
          returnUrl = decodedState.returnUrl
        }
      } catch (_) {
        // Ignore invalid state and continue with default callback route.
      }
    }

    if (returnUrl) {
      try {
        const redirectUrl = new URL(`${clientUrl}/login/auth-callback`)
        redirectUrl.searchParams.append("token", token)
        redirectUrl.searchParams.append("refreshToken", refreshToken)
        redirectUrl.searchParams.append("github-connected", "true")
        redirectUrl.searchParams.append("provider", "github")
        redirectUrl.searchParams.append("returnUrl", returnUrl)
        return res.redirect(redirectUrl.toString())
      } catch (_) { /* fall through */ }
    }

    const redirectUrl = new URL(`${clientUrl}/login/auth-callback`)
    redirectUrl.searchParams.append("token", token)
    redirectUrl.searchParams.append("refreshToken", refreshToken)
    redirectUrl.searchParams.append("userId", user._id)
    redirectUrl.searchParams.append("email", user.email)
    redirectUrl.searchParams.append("name", user.name)
    redirectUrl.searchParams.append("avatar", user.avatar || "")
    redirectUrl.searchParams.append("isNew", isNewUser ? "true" : "false")
    redirectUrl.searchParams.append("isLinked", isLinked ? "true" : "false")
    redirectUrl.searchParams.append("provider", "github")
    res.redirect(redirectUrl.toString())
  } catch (error) {
    console.error("[auth] GitHub callback error:", error)
    res.redirect(`${clientUrl}/login/error?message=${encodeURIComponent(error.message)}`)
  }
}

// Get Current User
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio || "",
      location: user.location || "",
      company: user.company || "",
      website: user.website || "",
      role: user.role,
      emailVerified: user.emailVerified,
      plan: user.plan,
      dbLimit: user.dbLimit,
      dbProvider: user.dbProvider,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || null,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, bio, location, company, website } = req.body
    const { userId } = req

    const user = await User.findByIdAndUpdate(
      userId,
      { name, avatar, bio, location, company, website },
      { new: true }
    )

    await AuditLog.create({
      userId,
      action: "USER_PROFILE_UPDATED",
      resourceType: "User",
      resourceId: userId,
      metadata: { name, avatar },
    })

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio || "",
      location: user.location || "",
      company: user.company || "",
      website: user.website || "",
      role: user.role,
      emailVerified: user.emailVerified,
      plan: user.plan,
      dbLimit: user.dbLimit,
      dbProvider: user.dbProvider,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || null,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body
    const { userId } = req

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    const user = await User.findById(userId).select("+password")

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword)

    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    await AuditLog.create({
      userId,
      action: "USER_PASSWORD_CHANGED",
      resourceType: "User",
      resourceId: userId,
      metadata: {},
    })

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex")
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")

    user.verificationToken = resetTokenHash
    user.verificationTokenExpires = Date.now() + 60 * 60 * 1000 // 1 hour
    await user.save()

    await AuditLog.create({
      userId: user._id,
      action: "PASSWORD_RESET_REQUESTED",
      resourceType: "User",
      resourceId: user._id,
      metadata: { email },
    })

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken)
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError)
      return res.status(500).json({ error: "Failed to send reset link. Please try again." })
    }

    res.json({
      message: "Password reset link sent to email",
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" })
    }

    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")

    const user = await User.findOne({
      verificationToken: resetTokenHash,
      verificationTokenExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" })
    }

    user.password = newPassword
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined
    await user.save()

    await AuditLog.create({
      userId: user._id,
      action: "PASSWORD_RESET_COMPLETED",
      resourceType: "User",
      resourceId: user._id,
      metadata: {},
    })

    res.json({ message: "Password reset successful" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
