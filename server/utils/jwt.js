// JWT Utilities
const jwt = require("jsonwebtoken")
const config = require("../config/env")

const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, config.jwtSecret, { expiresIn: "7d" })
}

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch (error) {
    return null
  }
}

module.exports = {
  generateToken,
  verifyToken,
}
