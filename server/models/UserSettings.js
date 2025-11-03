const mongoose = require("mongoose")

const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // General Settings
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    language: {
      type: String,
      default: "en",
    },

    // Deployment Settings
    deploymentSettings: {
      autoDeploy: {
        type: Boolean,
        default: false,
      },
      previewDeploys: {
        type: Boolean,
        default: true,
      },
      deployLocks: {
        type: Boolean,
        default: false,
      },
      deployBranch: {
        type: String,
        default: "main",
      },
    },

    // Notification Preferences
    notifications: {
      email: {
        enabled: {
          type: Boolean,
          default: true,
        },
        deployments: {
          type: Boolean,
          default: true,
        },
        errors: {
          type: Boolean,
          default: true,
        },
        updates: {
          type: Boolean,
          default: true,
        },
      },
      slack: {
        enabled: {
          type: Boolean,
          default: false,
        },
        webhookUrl: String,
        channel: String,
        events: [{
          type: String,
          enum: ["deployments", "errors", "updates"],
        }],
      },
      discord: {
        enabled: {
          type: Boolean,
          default: false,
        },
        webhookUrl: String,
        events: [{
          type: String,
          enum: ["deployments", "errors", "updates"],
        }],
      },
      webhooks: [{
        url: String,
        secret: String,
        events: [{
          type: String,
          enum: ["deployments", "errors", "updates"],
        }],
        active: {
          type: Boolean,
          default: true,
        },
      }],
    },

    // Security Settings
    security: {
      twoFactorAuth: {
        type: Boolean,
        default: false,
      },
      sessionTimeout: {
        type: Number,
        default: 24, // Hours
      },
      ipWhitelist: [{
        ip: String,
        description: String,
      }],
      loginNotifications: {
        type: Boolean,
        default: true,
      },
    },

    // Profile Settings
    profile: {
      displayName: String,
      bio: String,
      company: String,
      location: String,
      website: String,
      social: {
        github: String,
        twitter: String,
        linkedin: String,
      },
      visibility: {
        type: String,
        enum: ["public", "private", "team"],
        default: "public",
      },
    },

    // Appearance Settings
    appearance: {
      colorScheme: {
        type: String,
        enum: ["default", "professional", "modern", "classic"],
        default: "default",
      },
      density: {
        type: String,
        enum: ["comfortable", "compact", "spacious"],
        default: "comfortable",
      },
      codeTheme: {
        type: String,
        enum: ["default", "github", "monokai", "dracula"],
        default: "default",
      },
      fontSize: {
        type: Number,
        default: 14,
      },
      animations: {
        type: Boolean,
        default: true,
      },
    },

    // Integration Settings
    integrations: {
      github: {
        enabled: {
          type: Boolean,
          default: false,
        },
        token: String,
        username: String,
        repositories: [{
          name: String,
          fullName: String,
          private: Boolean,
          permissions: {
            admin: Boolean,
            push: Boolean,
            pull: Boolean,
          },
        }],
      },
      gitlab: {
        enabled: {
          type: Boolean,
          default: false,
        },
        token: String,
        username: String,
      },
      bitbucket: {
        enabled: {
          type: Boolean,
          default: false,
        },
        token: String,
        username: String,
      },
    },
  },
  { timestamps: true }
)

// Indexes
userSettingsSchema.index({ userId: 1 })
userSettingsSchema.index({ "integrations.github.username": 1 })
userSettingsSchema.index({ "integrations.gitlab.username": 1 })
userSettingsSchema.index({ "integrations.bitbucket.username": 1 })

module.exports = mongoose.models.UserSettings || mongoose.model("UserSettings", userSettingsSchema)