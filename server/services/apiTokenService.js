const crypto = require("crypto")
const { ApiToken } = require("../models/ApiToken")

class ApiTokenService {
  async generateToken(projectId, userId, name, scopes) {
    const tokenValue = crypto.randomBytes(32).toString("hex")
    const prefix = `pk_${projectId.toString().slice(0, 8)}_`
    const token = `${prefix}${tokenValue}`

    const apiToken = new ApiToken({
      projectId,
      userId,
      name,
      token: this._hashToken(token),
      prefix,
      scopes: scopes || ["read", "write"],
      isActive: true,
    })

    await apiToken.save()

    return {
      ...apiToken.toObject(),
      token: token, // Only return plain token once
    }
  }

  async listTokens(projectId, { limit = 50, offset = 0 }) {
    const tokens = await ApiToken.find({ projectId, isActive: true })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select("-token")

    const total = await ApiToken.countDocuments({ projectId, isActive: true })

    return { tokens, total, limit, offset }
  }

  async validateToken(token) {
    const hashedToken = this._hashToken(token)
    const apiToken = await ApiToken.findOne({
      token: hashedToken,
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    }).populate("projectId userId")

    if (!apiToken) return null

    // Update last used
    apiToken.lastUsedAt = new Date()
    await apiToken.save()

    return apiToken
  }

  async revokeToken(tokenId) {
    return await ApiToken.findByIdAndUpdate(
      tokenId,
      { isActive: false },
      { new: true }
    )
  }

  async rotateToken(tokenId) {
    const oldToken = await ApiToken.findById(tokenId)
    if (!oldToken) throw new Error("Token not found")

    await this.revokeToken(tokenId)

    const newTokenValue = crypto.randomBytes(32).toString("hex")
    const newToken = `${oldToken.prefix}${newTokenValue}`

    const rotatedToken = new ApiToken({
      projectId: oldToken.projectId,
      userId: oldToken.userId,
      name: `${oldToken.name} (rotated)`,
      token: this._hashToken(newToken),
      prefix: oldToken.prefix,
      scopes: oldToken.scopes,
      isActive: true,
    })

    await rotatedToken.save()

    return {
      ...rotatedToken.toObject(),
      token: newToken,
    }
  }

  async getTokenPermissions(tokenId) {
    const token = await ApiToken.findById(tokenId)
    if (!token) throw new Error("Token not found")

    return {
      scopes: token.scopes,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt,
    }
  }

  async updateTokenScopes(tokenId, scopes) {
    return await ApiToken.findByIdAndUpdate(
      tokenId,
      { scopes },
      { new: true }
    ).select("-token")
  }

  async getTokenUsage(tokenId) {
    const token = await ApiToken.findById(tokenId)
    if (!token) throw new Error("Token not found")

    return {
      tokenId,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt,
      scopes: token.scopes,
      expiresAt: token.expiresAt,
    }
  }

  _hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex")
  }
}

module.exports = new ApiTokenService()
