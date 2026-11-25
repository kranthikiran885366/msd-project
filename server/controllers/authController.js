const jwt = require("jsonwebtoken")
const User = require("../models/User")
const AuditLog = require("../models/AuditLog")
const AuthService = require("../services/authService")
const crypto = require("crypto")
const emailService = require("../utils/emailService")

const generateToken = (userId, version = 0) => {
  return jwt.sign({ userId, type: "access", version }, require("../config/env").jwtSecret, { expiresIn: "7d" })
}

const generateRefreshToken = (userId, version = 0) => {
  return jwt.sign({ userId, type: "refresh", version }, require("../config/env").jwtSecret, { expiresIn: "30d" })
}

async function finishOAuth(req, res, user, provider, isNewUser, isLinked) {
  const code = await require('../services/oauthExchange').issue(user, req.sessionID);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';
  const target = new URL('/login/auth-callback', clientUrl);
  target.searchParams.set('provider', provider);
  target.searchParams.set('isNew', String(Boolean(isNewUser)));
  target.searchParams.set('isLinked', String(Boolean(isLinked)));
  target.searchParams.set('returnUrl', require('../utils/authRedirect').safeReturnPath(req.session?.githubReturnUrl, clientUrl));
  if (req.session) delete req.session.githubReturnUrl;
  // Only a session-bound, short-lived, single-use grant goes to the browser.
  target.hash = new URLSearchParams({ code }).toString();
  req.session.save(error => error ? res.status(503).json({ error: 'OAuth session could not be saved' }) : res.redirect(target.toString()));
}
exports.exchangeOAuth = async (req, res, next) => {
  try {
    const expected = new URL(process.env.CLIENT_URL || 'http://localhost:5000').origin;
    if (req.get('origin') !== expected) return res.status(403).json({ error: 'OAuth exchange origin is not allowed' });
    const grant = await require('../services/oauthExchange').consume(req.body.code, req.sessionID);
    if (!grant) return res.status(401).json({ error: 'OAuth login expired or was already used. Please sign in again.' });
    const user = await User.findById(grant.userId);
    if (!user?.isActive || (user.tokenVersion || 0) !== grant.version) return res.status(401).json({ error: 'OAuth session is no longer valid' });
    res.json({ token: generateToken(user._id, user.tokenVersion || 0), refreshToken: generateRefreshToken(user._id, user.tokenVersion || 0) });
  } catch (error) { next(error); }
};

// Local Authentication - Signup
exports.signup = async (req, res) => {
  try {
    const { email, password, confirmPassword, name } = req.body

    // Validation
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof name !== "string" || !name.trim() || name.length > 100 || !password) {
      return res.status(400).json({ error: "Email, password, and name are required" })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" })
    }

    if (!require("../utils/passwordPolicy").validPassword(password)) {
      return res.status(400).json({ error: "Use at least 12 characters and at most 72 UTF-8 bytes" })
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
    const token = generateToken(user._id, user.tokenVersion || 0)
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion || 0)

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
        emailVerified: user.emailVerified,
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

    if (typeof email !== "string" || typeof password !== "string" || !email || !password || Buffer.byteLength(password) > 72) {
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
    const token = generateToken(user._id, user.tokenVersion || 0)
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion || 0)

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
        emailVerified: user.emailVerified,
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

    await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
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

    const decoded = jwt.verify(refreshToken, require("../config/env").jwtSecret)
    if (decoded.type !== "refresh") return res.status(401).json({ error: "Invalid refresh token" });
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive || (decoded.version || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ error: "Invalid refresh token" })
    }

    const newToken = generateToken(user._id, user.tokenVersion || 0)

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
    if (profile._json?.email_verified !== true && emails?.[0]?.verified !== true) throw new Error('A verified Google email address is required')
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
        emailVerified: true,
      }
    )

    const action = isNewUser ? "USER_SIGNED_UP_GOOGLE" : isLinked ? "USER_LINKED_GOOGLE" : "USER_LOGGED_IN_GOOGLE"
    await AuthService.createAuthAuditLog(user._id, action, { email: googleEmail })

    return await finishOAuth(req, res, user, 'google', isNewUser, isLinked);
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

    const verifiedResponse = await require('axios').get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' }, timeout: 10000,
    });
    const verifiedEmails = verifiedResponse.data.filter(item => item.verified === true);
    const githubEmail = (verifiedEmails.find(item => item.primary) || verifiedEmails[0])?.email;
    if (!githubEmail) throw new Error('A verified GitHub email address is required');

    const { user, isNewUser, isLinked } = await AuthService.findOrCreateUser(
      githubEmail,
      "github",
      {
        id,
        login: username,
        avatar_url: photos?.[0]?.value,
        name: displayName || username,
        accessToken,
        emailVerified: true,
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

    return await finishOAuth(req, res, user, 'github', isNewUser, isLinked);
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

    if (!require("../utils/passwordPolicy").validPassword(newPassword)) {
      return res.status(400).json({ error: "Use at least 12 characters and at most 72 UTF-8 bytes" })
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

    // Changing a password revokes existing access and refresh tokens.
    user.tokenVersion = (user.tokenVersion || 0) + 1
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

    if (!require("../utils/passwordPolicy").validPassword(newPassword) || typeof resetToken !== "string" || !/^[a-f\d]{40}$/i.test(resetToken)) return res.status(400).json({ error: "A valid reset token and a 12–72 byte password are required" });
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")

    const user = await User.findOne({
      verificationToken: resetTokenHash,
      verificationTokenExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" })
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1
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

exports.requestEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user.emailVerified) return res.json({ message: 'Email is already verified' });
    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    user.emailVerificationExpires = new Date(Date.now() + 86400000);
    await user.save();
    const client = process.env.CLIENT_URL || 'http://localhost:5000';
    const url = new URL('/verify-email', client); url.hash = new URLSearchParams({ token }).toString();
    await emailService.sendEmail({ to: user.email, subject: 'Verify your CloudDeck email', text: `Verify your email by opening ${url}. This link expires in 24 hours. If you did not request this, ignore this email.` });
    res.json({ message: 'Verification email sent. Open the latest link within 24 hours.' });
  } catch (error) { next(error); }
};
exports.verifyEmail = async (req, res, next) => {
  try {
    const token = req.body.token;
    if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token)) return res.status(400).json({ error: 'Invalid verification link' });
    const user = await User.findOneAndUpdate({ emailVerificationToken: crypto.createHash('sha256').update(token).digest('hex'), emailVerificationExpires: { $gt: new Date() } }, { $set: { emailVerified: true }, $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 } }, { new: true });
    if (!user) return res.status(400).json({ error: 'Verification link expired or was already used' });
    res.json({ message: 'Your email is verified. You can open your workspace.' });
  } catch (error) { next(error); }
};
