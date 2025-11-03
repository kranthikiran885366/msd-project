const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'USER_SIGNED_UP', 'USER_LOGGED_IN', 'USER_LOGGED_OUT', 'USER_SIGNED_UP_GITHUB', 'USER_LOGGED_IN_GITHUB', 'USER_SIGNED_UP_GOOGLE', 'USER_LOGGED_IN_GOOGLE', 'ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED', 'PERMISSION_CREATED', 'USER_ROLE_ASSIGNED', 'USER_ROLE_REMOVED', 'DATABASE_CREATED', 'DATABASE_UPDATED', 'DATABASE_DELETED', 'DATABASE_QUERY_EXECUTED', 'DATABASE_BACKUP_CREATED', 'DATABASE_BACKUP_RESTORED', 'DATABASE_BACKUP_DELETED', 'DATABASE_USER_CREATED', 'API_TOKEN_CREATED', 'API_TOKEN_ROTATED', 'API_TOKEN_REVOKED', 'API_TOKEN_DELETED', 'WEBHOOK_CREATED', 'WEBHOOK_UPDATED', 'WEBHOOK_DELETED', 'WEBHOOK_TESTED', 'WEBHOOK_DELIVERY_RETRIED', 'WEBHOOKS_BULK_DISABLED', 'WEBHOOK_DELIVERIES_CLEARED', 'TEAM_MEMBER_ADDED', 'TEAM_MEMBER_ROLE_UPDATED', 'TEAM_MEMBER_REMOVED', 'TEAM_INVITATION_SENT', 'TEAM_INVITATION_ACCEPTED', 'TEAM_INVITATION_DECLINED', 'TEAM_INVITATION_RESENT', 'TEAM_INVITATION_REVOKED', 'TEAM_SETTINGS_UPDATED', 'TEAM_MEMBERS_BULK_ADDED', 'TEAM_MEMBERS_BULK_REMOVED', 'ENV_VAR_CREATED', 'ENV_VAR_UPDATED', 'ENV_VAR_DELETED', 'DOMAIN_ADDED', 'DOMAIN_UPDATED', 'DOMAIN_DELETED', 'BUILD_SETTINGS_UPDATED', 'SETTINGS_UPDATED', 'ENV_VARS_BULK_CREATED', 'ACCESS_POLICY_CREATED', 'ACCESS_POLICY_DELETED', 'AUDIT_LOGS_ARCHIVED']
  },
  resourceType: {
    type: String,
    required: true
  },
  resourceId: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
})

// Index for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 })
auditLogSchema.index({ resourceType: 1, createdAt: -1 })
auditLogSchema.index({ action: 1, createdAt: -1 })

// Avoid model overwrite error in development
module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)