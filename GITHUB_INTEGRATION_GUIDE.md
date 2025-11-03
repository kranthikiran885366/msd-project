# GitHub Integration Setup Guide

## Overview
This document explains how to set up and use the GitHub integration for importing repositories and deploying directly from GitHub.

## Backend Configuration

### Environment Variables
Add these variables to your `.env` file:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_URL=https://your-deployer-domain.com

# Session & JWT
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001
```

### GitHub OAuth App Setup

1. **Create GitHub OAuth App**:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Fill in the application details:
     - **Application name**: Deployer
     - **Homepage URL**: `http://localhost:3000` (or your production URL)
     - **Authorization callback URL**: `http://localhost:5000/auth/github/callback`
   - Copy the `Client ID` and `Client Secret`

2. **Environment Variables**:
   ```
   GITHUB_CLIENT_ID=<your_client_id>
   GITHUB_CLIENT_SECRET=<your_client_secret>
   ```

## Frontend Usage

### 1. **Connecting GitHub Account**

Users can connect their GitHub account through:
- Settings page → Integrations → Connect GitHub
- Or during the deployment creation process

### 2. **Importing Repositories**

When creating a new deployment:

1. Click "New Deployment"
2. Choose "GitHub" tab
3. Click "Select GitHub Repository"
4. GitHub authentication dialog opens (if not connected)
5. Browse and search your repositories
6. Select a repository
7. Choose a branch
8. Click "Import Repository"
9. Select project and environment
10. Click "Create Deployment"

### 3. **Features**

#### Repository Browser
- Search repositories by name, fullName, or description
- Filter by private/public repositories
- View repository metadata (language, stars, default branch)
- Real-time branch loading

#### Branch Selection
- Auto-selects default branch
- Shows all available branches
- Displays branch protection status

#### Deployment Configuration
- Choose target project
- Select environment (Staging/Production/Development)
- Auto-populated with GitHub repo metadata

## API Endpoints

### GitHub Provider Routes

```
GET  /api/github-provider/repositories
GET  /api/github-provider/repositories/:owner/:repo
GET  /api/github-provider/repositories/:owner/:repo/branches
GET  /api/github-provider/repositories/:owner/:repo/file/:path
GET  /api/github-provider/repositories/:owner/:repo/webhooks
POST /api/github-provider/connect
POST /api/github-provider/disconnect
POST /api/github-provider/repositories/:owner/:repo/webhooks/deployment
GET  /api/github-provider/status
```

## Deployment from GitHub

When deploying from GitHub, the system:
1. Clones the repository at the specified branch
2. Analyzes project structure (package.json, Dockerfile, etc.)
3. Auto-detects build configuration
4. Creates deployment with GitHub metadata
5. Optionally creates push webhooks for auto-deployment

## Webhook Integration

### Auto-Deployment Setup

To enable auto-deployment on GitHub pushes:

1. Navigate to repository deployment settings
2. Click "Create Deployment Webhook"
3. System creates GitHub webhook pointing to your deployer
4. Future pushes automatically trigger deployments

### Webhook Events

- **push**: Triggered on code pushes to watched branches
- **pull_request**: Triggered on PR events (optional)

## Troubleshooting

### GitHub Connection Issues
- **Token expired**: Reconnect GitHub account
- **Permission denied**: Ensure GitHub app has repo access scope
- **Rate limit**: GitHub has API rate limits (60 req/hour for unauthenticated)

### Repository Not Appearing
- Ensure GitHub app has "repositories" scope
- Check user permissions for the repository
- Try refreshing the repository list

### Deployment Failures
- Check branch exists in repository
- Verify build configuration in repository root
- Review deployment logs for specific errors

## Security Considerations

### Token Storage
- GitHub access tokens encrypted in database
- Never exposed in frontend or logs
- Automatically refreshed when expired

### Webhook Security
- Webhooks validated with GitHub webhook secret
- Only processes verified GitHub events
- Deployed code scanned for security issues

### Permissions
- GitHub app requests minimal permissions needed
- Users can revoke access at any time
- OAuth tokens stored securely

## Advanced Usage

### Environment Variables from GitHub
- Auto-detect `.env.example` files
- Display available environment variables
- Allow configuration during deployment

### Repository Analysis
- Detect framework (Next.js, React, Node, etc.)
- Auto-configure build commands
- Suggest optimal deployment settings

### Deployment Monitoring
- Monitor GitHub branch for changes
- Track deployment status back to GitHub
- Update PR/commit status checks

## API Client Methods

```javascript
// Get repositories
await apiClient.getGitHubRepositories()

// Get repository details
await apiClient.getGitHubRepositoryDetails(owner, repo)

// Get branches
await apiClient.getGitHubRepositoryBranches(owner, repo)

// Get file content
await apiClient.getGitHubRepositoryFile(owner, repo, path, ref)

// Connection management
await apiClient.connectGitHub(accessToken, refreshToken, expiresAt)
await apiClient.disconnectGitHub()
await apiClient.getGitHubConnectionStatus()

// Webhooks
await apiClient.getGitHubWebhooks(owner, repo)
await apiClient.createGitHubDeploymentWebhook(owner, repo)
```

## Next Steps

1. Set up GitHub OAuth app
2. Configure environment variables
3. Test GitHub connection
4. Import a test repository
5. Configure deployment settings
6. Deploy from GitHub
