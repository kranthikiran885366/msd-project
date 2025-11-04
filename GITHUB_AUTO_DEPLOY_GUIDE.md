# GitHub Integration for Auto-Deployments

This guide shows you how to set up GitHub integration for automatic deployments, similar to Netlify and Render.

## Overview

The GitHub integration allows you to:
- ✅ Automatically deploy when you push code to GitHub
- ✅ Create preview deployments for pull requests
- ✅ View deployment status directly in GitHub
- ✅ Rollback deployments easily
- ✅ Configure branch-specific deployment rules

## Step-by-Step Setup

### Step 1: Connect Your GitHub Account

1. Go to your **Dashboard** or **Projects** page
2. Click **"Import GitHub Repository"** or **"Connect GitHub"**
3. You'll be redirected to GitHub's authorization page
4. Click **"Authorize"** to grant access to your repositories
5. You'll be redirected back to the deployer app

### Step 2: Select a Repository

1. In the **New Deployment** dialog, click **"GitHub Repository"**
2. Search for your repository in the list
3. Select the repository you want to deploy
4. Choose the default branch (usually `main` or `master`)
5. Click **"Import Repository"**

### Step 3: Configure Automatic Deployments

1. Go to **Projects** → Select your project
2. Click **"GitHub Setup"** or **"Configure Deployments"**
3. You should see your repository is connected
4. Set up the webhook:
   - Click **"Setup Webhook"**
   - This will create a webhook in your GitHub repository
   - You'll see confirmation once the webhook is active

### Step 4: Enable Auto-Deploy Settings

In the **Deployment Settings** section:

- **Auto Deploy on Push**: Enable this to deploy automatically whenever you push to the main branch
- **Preview Deployments**: Enable this to create preview URLs for pull requests
- Click **"Save Settings"**

## How Automatic Deployments Work

```
Your Local Machine
        ↓ (git push)
GitHub Repository
        ↓ (webhook notification)
CloudDeck Deployer
        ↓ (builds & deploys)
Production Environment
```

### Detailed Flow:

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin main
   ```

2. **GitHub Sends Webhook**
   - GitHub automatically notifies CloudDeck about the push
   - Includes commit info, branch, author details

3. **Build Starts Automatically**
   - CloudDeck downloads your latest code
   - Installs dependencies (npm, pip, etc.)
   - Runs build command based on your framework
   - Runs tests (if configured)

4. **Deployment Happens**
   - If build succeeds, deployment starts
   - Code is deployed to your specified environment
   - You can monitor progress in real-time

5. **Post-Deployment**
   - GitHub status is updated (✓ or ✗)
   - Deployment notification is sent
   - Preview/production URL is updated

## Pull Request Preview Deployments

With **Preview Deployments** enabled:

1. Create a Pull Request on GitHub
2. CloudDeck automatically creates a preview deployment
3. Get a unique URL to test your changes
4. GitHub shows deployment status in the PR
5. Once approved and merged, production deployment happens automatically

## Configuration Options

### Branch Rules

Control which branches trigger deployments:
- **Production branch**: Usually `main` or `master` (deploys to production)
- **Staging branches**: Deploy to staging environment
- **Development branches**: Can be skipped or deployed to development

### Build Commands

CloudDeck auto-detects your framework and runs:
- **Next.js**: `npm run build`
- **React**: `npm run build`
- **Vue**: `npm run build`
- **Angular**: `ng build`
- **Python Flask**: `pip install -r requirements.txt`
- **Python Django**: `python manage.py collectstatic`

### Environment Variables

Set environment variables in the deployment settings:
```
API_URL=https://api.example.com
DATABASE_URL=postgres://...
DEBUG=false
```

## Monitoring Deployments

### In CloudDeck Dashboard:
- Go to **Deployments** page
- See all automated deployments triggered by GitHub
- Click on a deployment to view:
  - Build logs
  - Deployment status
  - Performance metrics
  - Rollback option

### In GitHub:
- Go to your repository
- Click **"Deployments"** tab
- See deployment history and status
- View deployment environment URL

## Webhook Details

The GitHub webhook is configured to listen for:

1. **Push Events**: Triggered when code is pushed
2. **Pull Request Events**: Triggered when PR is opened/updated
3. **Release Events**: Triggered when a release is created

**Webhook URL**: `https://your-deployer.com/api/deployments/webhooks/git/github/[projectId]`

**Headers for Security**:
- `X-Hub-Signature-256`: Used to verify the webhook is from GitHub

## Troubleshooting

### Deployment Not Triggering

1. **Check Webhook Status**
   - Go to GitHub repository → Settings → Webhooks
   - You should see the CloudDeck webhook listed
   - Click it to see delivery history
   - Check if there were any errors

2. **Verify Auto-Deploy is Enabled**
   - Go to your project's GitHub Setup page
   - Confirm "Auto Deploy on Push" toggle is ON

3. **Check Branch Configuration**
   - Make sure you're pushing to the correct branch
   - Verify the branch is set to trigger deployments

### Build Failures

1. Check build logs in the **Deployment Details** page
2. Common causes:
   - Missing environment variables
   - Incorrect build command
   - Dependency installation failed
   - Tests failed

### Webhook Not Connecting

1. Verify GitHub OAuth token has `repo` and `admin:repo_hook` scopes
2. Check if your deployer URL is accessible from the internet
3. Ensure firewall allows inbound HTTPS connections on port 443

## Advanced: Manual Webhook Testing

Test your webhook manually:
```bash
curl -X POST https://your-deployer.com/api/deployments/webhooks/git/github/[projectId] \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d @payload.json
```

## Security Best Practices

✅ **Do:**
- Keep your OAuth token secure
- Use environment variables for sensitive data
- Enable "Auto Merge" only for trusted branches
- Monitor webhook delivery logs

❌ **Don't:**
- Commit secrets to GitHub
- Use the same token for multiple services
- Deploy directly to production without tests
- Ignore failed deployments

## Next Steps

1. ✅ Connected your GitHub account
2. ✅ Selected a repository
3. ✅ Configured webhooks
4. ✅ Enabled auto-deploy settings
5. 🔄 **Push code and watch it deploy automatically!**

For more help, visit the **Deployments** page or contact support.
