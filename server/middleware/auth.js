// Authentication Middleware
const jwt = require("jsonwebtoken")
const config = require("../config/env")

// Primary middleware for routes that require a valid JWT
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }
    const decoded = jwt.verify(token, config.jwtSecret || process.env.JWT_SECRET)

    // Attach both for compatibility: some controllers expect req.user, others req.userId
    if (decoded.type !== "access") return res.status(401).json({ error: "Invalid access token" });
    const uid = decoded.userId || decoded.id || decoded.user || decoded.sub
    if (!uid) return res.status(401).json({ error: "Invalid access token" });
    const account = await require('../models/User').findById(uid).select('isActive tokenVersion emailVerified');
    if (!account || !account.isActive || (decoded.version || 0) !== (account.tokenVersion || 0)) return res.status(401).json({ error: 'Session is no longer valid' });
    const route = req.originalUrl?.split('?')[0];
    if (config.nodeEnv === 'production' && !account.emailVerified && !['/auth/profile','/auth/logout','/auth/email-verification/request','/auth/change-password'].includes(route)) return res.status(403).json({ error: 'Verify your email before using the production workspace' });
    req.user = { ...decoded, id: uid, _id: uid }
    req.userId = uid

    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid token" })
  }
}

module.exports = authMiddleware
module.exports.authenticate = authMiddleware
