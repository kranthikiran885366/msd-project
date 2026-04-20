/**
 * Authentication Service
 * Utility functions for user authentication and provider management
 */

const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

class AuthService {
  /**
   * Find or create a user for OAuth/social login
   * @param {string} email - Email address
   * @param {string} provider - Provider name (google, github)
   * @param {object} providerData - Data from the provider
   * @returns {object} { user, isNewUser, isLinked }
   */
  static async findOrCreateUser(email, provider, providerData) {
    if (!email) {
      throw new Error(`${provider} account does not have an email address`);
    }

    const normalizedEmail = email.toLowerCase();
    let user = null;
    let isNewUser = false;
    let isLinked = false;

    // 1. Try to find by provider ID first (fastest path, avoids email collision)
    if (provider === "google" && providerData.id) {
      user = await User.findByGoogleId(providerData.id);
    } else if (provider === "github" && providerData.id) {
      user = await User.findByGithubId(providerData.id);
    }

    if (user) {
      // Known provider ID — just refresh token/lastLogin
      user.lastLogin = new Date();
      if (provider === "github" && user.oauth?.github && providerData.accessToken) {
        user.oauth.github.accessToken = providerData.accessToken;
      }
      if (provider === "google" && user.oauth?.google && providerData.refreshToken) {
        user.oauth.google.refreshToken = providerData.refreshToken;
      }
      await user.save();
      return { user, isNewUser: false, isLinked: false };
    }

    // 2. Provider ID not found — check by email
    user = await User.findByEmail(normalizedEmail);

    if (user) {
      // Email exists — link this provider to the existing account
      isLinked = true;
      user.linkProvider(provider, providerData);
      user.lastLogin = new Date();
      if (!user.avatar) {
        user.avatar = providerData.picture || providerData.avatar_url || null;
      }
      await user.save();
      return { user, isNewUser: false, isLinked: true };
    }

    // 3. Completely new user
    isNewUser = true;
    const oauthData = { google: {}, github: {} };

    if (provider === "google") {
      oauthData.google = {
        id: providerData.id,
        email: providerData.email || normalizedEmail,
        picture: providerData.picture,
        refreshToken: providerData.refreshToken,
      };
    } else if (provider === "github") {
      oauthData.github = {
        id: providerData.id,
        login: providerData.login,
        avatar_url: providerData.avatar_url,
        accessToken: providerData.accessToken,
      };
    }

    user = new User({
      email: normalizedEmail,
      name: providerData.name || providerData.displayName || providerData.login || "User",
      avatar: providerData.picture || providerData.avatar_url,
      emailVerified: providerData.emailVerified !== undefined ? providerData.emailVerified : !!providerData.email,
      oauth: oauthData,
    });

    await user.save();
    return { user, isNewUser: true, isLinked: false };
  }

  /**
   * Validate if email is unique (excluding a specific user)
   * @param {string} email - Email to check
   * @param {string} excludeUserId - User ID to exclude from check
   * @returns {boolean} True if email is unique
   */
  static async validateUniqueEmail(email, excludeUserId = null) {
    const query = { email: email.toLowerCase() };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const existingUser = await User.findOne(query);
    return !existingUser;
  }

  /**
   * Get all linked providers for a user
   * @param {object} user - User object
   * @returns {array} Array of provider names
   */
  static getUserProviders(user) {
    return user.getLinkedProviders?.() || [];
  }

  /**
   * Check if a user has a specific provider linked
   * @param {object} user - User object
   * @param {string} provider - Provider name
   * @returns {boolean} True if provider is linked
   */
  static hasProvider(user, provider) {
    return user.hasProvider?.(provider) || false;
  }

  /**
   * Create audit log for auth action
   * @param {string} userId - User ID
   * @param {string} action - Action name
   * @param {object} metadata - Additional metadata
   */
  static async createAuthAuditLog(userId, action, metadata = {}) {
    try {
      await AuditLog.create({
        userId,
        action,
        resourceType: "User",
        resourceId: userId,
        metadata,
      });
    } catch (error) {
      console.error("[v0] Failed to create audit log:", error);
    }
  }
}

module.exports = AuthService;
