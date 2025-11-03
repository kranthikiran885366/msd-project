// Authentication Middleware
const jwt = require("jsonwebtoken")
const config = require("../config/env")

// Primary middleware for routes that require a valid JWT
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }
    const decoded = jwt.verify(token, config.jwtSecret || process.env.JWT_SECRET)

    // Attach both for compatibility: some controllers expect req.user, others req.userId
    req.user = decoded
    req.userId = decoded.userId || decoded.id || decoded.user || decoded.sub

    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid token" })
  }
}

module.exports = authMiddleware
