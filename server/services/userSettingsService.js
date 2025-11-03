const UserSettings = require("../models/UserSettings")
const User = require("../models/User")
const ApiError = require("../utils/errors")
const { validateTimezone, validateLanguage } = require("../utils/validation")

class UserSettingsService {
  constructor() {
    this.userSettings = UserSettings
    this.user = User
  }

  async getUserSettings(userId) {
    const settings = await this.userSettings.findOne({ userId })
    if (!settings) {
      // Create default settings if none exist
      return this.createDefaultSettings(userId)
    }
    return settings
  }

  async createDefaultSettings(userId) {
    const settings = new this.userSettings({ userId })
    return settings.save()
  }

  async updateGeneralSettings(userId, updates) {
    if (updates.timezone && !validateTimezone(updates.timezone)) {
      throw new ApiError("Invalid timezone", 400)
    }

    if (updates.language && !validateLanguage(updates.language)) {
      throw new ApiError("Invalid language", 400)
    }

    return this.userSettings.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    )
  }

  async updateDeploymentSettings(userId, updates) {
    return this.userSettings.findOneAndUpdate(
      { userId },
      { $set: { deploymentSettings: updates } },
      { new: true, upsert: true }
    )
  }

  async updateNotificationSettings(userId, updates) {
    // Validate webhook URLs if provided
    if (updates.webhooks) {
      updates.webhooks.forEach(webhook => {
        if (webhook.url && !this._isValidUrl(webhook.url)) {
          throw new ApiError("Invalid webhook URL", 400)
        }
      })
    }

    return this.userSettings.findOneAndUpdate(
      { userId },
      { $set: { notifications: updates } },
      { new: true, upsert: true }
    )
  }

  async updateSecuritySettings(userId, updates) {
    // Validate IP whitelist
    if (updates.ipWhitelist) {
      updates.ipWhitelist.forEach(entry => {
        if (!this._isValidIp(entry.ip)) {
          throw new ApiError("Invalid IP address", 400)
        }
      })
    }

    return this.userSettings.findOneAndUpdate(
      { userId },
      { $set: { security: updates } },
      { new: true, upsert: true }
    )
  }

  async updateProfileSettings(userId, updates) {
    // Validate social links if provided
    if (updates.social) {
      Object.values(updates.social).forEach(url => {
        if (url && !this._isValidUrl(url)) {
          throw new ApiError("Invalid social media URL", 400)
        }
      })
    }

    // Update both UserSettings and User models
    await this.user.findByIdAndUpdate(userId, {
      name: updates.displayName,
    })

    return this.userSettings.findOneAndUpdate(
      { userId },
      { $set: { profile: updates } },
      { new: true, upsert: true }
    )
  }

  async updateAppearanceSettings(userId, updates) {
    return this.userSettings.findOneAndUpdate(
      { userId },
      { $set: { appearance: updates } },
      { new: true, upsert: true }
    )
  }

  async updateIntegrationSettings(userId, integration, updates) {
    const validIntegrations = ["github", "gitlab", "bitbucket"]
    if (!validIntegrations.includes(integration)) {
      throw new ApiError("Invalid integration type", 400)
    }

    return this.userSettings.findOneAndUpdate(
      { userId },
      { $set: { [`integrations.${integration}`]: updates } },
      { new: true, upsert: true }
    )
  }

  async deleteAccount(userId) {
    // Begin transaction
    const session = await this.userSettings.startSession()
    await session.startTransaction()

    try {
      // Delete user settings
      await this.userSettings.findOneAndDelete({ userId }).session(session)

      // Delete user account
      await this.user.findByIdAndDelete(userId).session(session)

      // Commit transaction
      await session.commitTransaction()
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  // Helper methods
  _isValidUrl(string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  _isValidIp(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }
}

module.exports = new UserSettingsService()