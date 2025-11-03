// Rate Limiter Middleware
const rateLimit = require("express-rate-limit")

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "development",
  })
}

const deploymentLimiter = createRateLimiter(15 * 60 * 1000, 20)
const functionLimiter = createRateLimiter(15 * 60 * 1000, 50)
const apiLimiter = createRateLimiter(15 * 60 * 1000, 100)

module.exports = {
  createRateLimiter,
  deploymentLimiter,
  functionLimiter,
  apiLimiter,
}
