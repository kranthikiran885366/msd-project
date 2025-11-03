const apiTokenService = require("../services/apiTokenService")
const ApiToken = require("../models/ApiToken")
const AuditLog = require("../models/AuditLog")

// Token Management
exports.createToken = async (req, res) => {
  try {
    const { projectId, name, description, scopes, expiresIn } = req.body
    const { userId } = req

    const token = await apiTokenService.generateToken({
      projectId,
      name,
      description,
      scopes,
      expiresIn,
      createdBy: userId,
    })

    await AuditLog.create({
      userId,
      action: "API_TOKEN_CREATED",
      resourceType: "ApiToken",
      resourceId: token._id,
      metadata: { name, scopes },
    })

    res.status(201).json(token)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listTokens = async (req, res) => {
  try {
    const { projectId } = req.query

    const tokens = await ApiToken.find({
      projectId,
      revoked: false,
    }).select("-secret")

    res.json(tokens)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getToken = async (req, res) => {
  try {
    const { tokenId } = req.params

    const token = await ApiToken.findById(tokenId).select("-secret")

    if (!token) {
      return res.status(404).json({ error: "Token not found" })
    }

    res.json(token)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.rotateToken = async (req, res) => {
  try {
    const { tokenId } = req.params
    const { userId } = req

    const newToken = await apiTokenService.rotateToken(tokenId)

    await AuditLog.create({
      userId,
      action: "API_TOKEN_ROTATED",
      resourceType: "ApiToken",
      resourceId: tokenId,
      metadata: {},
    })

    res.json(newToken)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.revokeToken = async (req, res) => {
  try {
    const { tokenId } = req.params
    const { userId } = req

    const token = await apiTokenService.revokeToken(tokenId)

    await AuditLog.create({
      userId,
      action: "API_TOKEN_REVOKED",
      resourceType: "ApiToken",
      resourceId: tokenId,
      metadata: {},
    })

    res.json(token)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteToken = async (req, res) => {
  try {
    const { tokenId } = req.params
    const { userId } = req

    await ApiToken.findByIdAndDelete(tokenId)

    await AuditLog.create({
      userId,
      action: "API_TOKEN_DELETED",
      resourceType: "ApiToken",
      resourceId: tokenId,
      metadata: {},
    })

    res.json({ message: "Token deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Token Usage
exports.getTokenUsage = async (req, res) => {
  try {
    const { tokenId, timeRange = 30 } = req.query

    const usage = await apiTokenService.getTokenUsage(tokenId, parseInt(timeRange))

    res.json(usage)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getTokenStats = async (req, res) => {
  try {
    const { projectId, timeRange = 30 } = req.query

    const stats = await apiTokenService.getProjectTokenStats(projectId, parseInt(timeRange))

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.validateToken = async (req, res) => {
  try {
    const { token } = req.body

    const isValid = await apiTokenService.validateToken(token)

    res.json({ valid: isValid })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
