# API Routes Reference

## Build Management Routes

```javascript
// POST /api/builds/project/:projectId - Create build
// GET /api/builds/project/:projectId - List builds
// GET /api/builds/:buildId - Get build details
// PATCH /api/builds/:buildId/status - Update build status
// POST /api/builds/:buildId/logs - Add build log
// POST /api/builds/:buildId/steps - Add build step
// PATCH /api/builds/:buildId/steps/:stepId - Update step
// POST /api/builds/:buildId/hooks - Execute hooks
// POST /api/builds/:buildId/retry - Retry failed build
// POST /api/builds/:buildId/cancel - Cancel build
// GET /api/builds/:buildId/logs - Get build logs
// GET /api/builds/:buildId/metrics - Get metrics
// GET /api/builds/:buildId/analytics - Get analytics
```

## Function Management Routes

```javascript
// POST /api/functions/project/:projectId - Create function
// GET /api/functions/project/:projectId - List functions
// GET /api/functions/:functionId - Get function details
// PATCH /api/functions/:functionId - Update function
// DELETE /api/functions/:functionId - Delete function
// POST /api/functions/:functionId/invoke - Invoke function
// GET /api/functions/:functionId/logs - Get execution logs
// GET /api/functions/:functionId/metrics - Get metrics
// POST /api/functions/:functionId/test - Test function
// PATCH /api/functions/:functionId/toggle - Toggle enabled/disabled
// PATCH /api/functions/:functionId/code - Update code
// POST /api/functions/:functionId/deploy - Deploy function
// GET /api/functions/:functionId/analytics - Get analytics
```

## Security & RBAC Routes

```javascript
// POST /api/security/roles - Create role
// GET /api/security/roles - List roles
// PATCH /api/security/roles/:roleId - Update role
// DELETE /api/security/roles/:roleId - Delete role
// POST /api/security/roles/:roleId/permissions - Assign permissions
// POST /api/security/users/:userId/roles/:roleId - Assign role to user
// DELETE /api/security/users/:userId/roles/:roleId - Remove role from user
// GET /api/security/audit-logs - Get audit logs
// GET /api/security/audit-logs/:userId - Get user audit logs
```

## Analytics & Monitoring Routes

```javascript
// POST /api/analytics/metrics - Record metric
// POST /api/analytics/batch-metrics - Record multiple metrics
// GET /api/analytics/metrics - Get metrics by type
// GET /api/analytics/aggregates - Calculate aggregates
// GET /api/analytics/dashboard - Get dashboard metrics
// POST /api/alerts - Create alert
// GET /api/alerts - List alerts
// PATCH /api/alerts/:alertId - Update alert
// POST /api/alerts/:alertId/resolve - Resolve alert
// POST /api/alerts/:alertId/mute - Mute alert
// GET /api/alerts/:alertId/check - Check alert conditions
```

## Team Collaboration Routes

```javascript
// POST /api/team/members - Invite member
// GET /api/team/members - List team members
// GET /api/team/members/:memberId - Get member details
// PATCH /api/team/members/:memberId/role - Update member role
// DELETE /api/team/members/:memberId - Remove member
// POST /api/team/invitations/:inviteToken/accept - Accept invitation
// GET /api/team/invitations/pending - List pending invitations
// POST /api/team/invitations/:memberId/resend - Resend invitation
// GET /api/team/activity-logs - Get activity logs
```

## Database Management Routes

```javascript
// POST /api/databases - Create database
// GET /api/databases - List databases
// GET /api/databases/:databaseId - Get database details
// PATCH /api/databases/:databaseId - Update database
// DELETE /api/databases/:databaseId - Delete database
// POST /api/databases/:databaseId/query - Execute query
// GET /api/databases/:databaseId/tables - List tables
// GET /api/databases/:databaseId/tables/:tableName - Get table info
// POST /api/databases/:databaseId/backups - Create backup
// GET /api/databases/:databaseId/backups - List backups
// POST /api/databases/:databaseId/backups/:backupId/restore - Restore backup
// DELETE /api/databases/:databaseId/backups/:backupId - Delete backup
// PATCH /api/databases/:databaseId/backup-schedule - Update schedule
```

## Developer Tools Routes

### API Tokens
```javascript
// POST /api/dev/tokens - Generate token
// GET /api/dev/tokens - List tokens
// PATCH /api/dev/tokens/:tokenId/rotate - Rotate token
// DELETE /api/dev/tokens/:tokenId - Revoke token
// GET /api/dev/tokens/:tokenId/usage - Get usage stats
// PATCH /api/dev/tokens/:tokenId/scopes - Update scopes
```

### Webhooks
```javascript
// POST /api/dev/webhooks - Create webhook
// GET /api/dev/webhooks - List webhooks
// PATCH /api/dev/webhooks/:webhookId - Update webhook
// DELETE /api/dev/webhooks/:webhookId - Delete webhook
// POST /api/dev/webhooks/:webhookId/test - Test webhook
// GET /api/dev/webhooks/:webhookId/deliveries - Get deliveries
// POST /api/dev/webhooks/:webhookId/deliveries/:deliveryId/retry - Retry delivery
// PATCH /api/dev/webhooks/:webhookId/retry-policy - Update retry policy
```

## Settings Routes

```javascript
// POST /api/settings/env-vars - Create env var
// GET /api/settings/env-vars - List env vars
// DELETE /api/settings/env-vars/:varId - Delete env var
// POST /api/settings/domains - Add domain
// GET /api/settings/domains - List domains
// PATCH /api/settings/domains/:domainId - Update domain
// DELETE /api/settings/domains/:domainId - Delete domain
// PATCH /api/settings/build - Update build config
// GET /api/settings/build - Get build config
```

---

## Authentication

All routes require:
```javascript
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* resource data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Environment Variables

```
NODE_ENV=production
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
PORT=3000
```

---

## Middleware Stack

All routes include:
1. Authentication middleware (`checkAuth`)
2. RBAC middleware (where applicable)
3. Error handling middleware
4. Request logging middleware

---

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Consider implementing:
- 100 requests per minute for most endpoints
- 10 requests per minute for API token generation
- 5 requests per minute for sensitive operations

---

## Pagination

List endpoints support:
- `limit` - Results per page (default: 50)
- `offset` - Number of results to skip (default: 0)

Response includes:
```json
{
  "data": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

## Webhook Events

Supported events:
- `build.created`
- `build.started`
- `build.completed`
- `build.failed`
- `function.created`
- `function.invoked`
- `function.failed`
- `deployment.started`
- `deployment.completed`
- `team.member.added`
- `database.created`
- `database.deleted`

---

## Best Practices

1. **Always validate input** at the controller level
2. **Use appropriate HTTP methods** (POST, GET, PATCH, DELETE)
3. **Return proper status codes**
4. **Include timestamps** in all responses
5. **Implement proper error handling**
6. **Log all operations** for audit trails
7. **Use pagination** for list endpoints
8. **Cache responses** where applicable
9. **Implement rate limiting** for sensitive endpoints
10. **Validate authorization** at middleware level

