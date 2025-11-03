# GitHub Integration - Setup & Installation Guide

## Quick Start Checklist

- [ ] Create GitHub OAuth Application
- [ ] Configure Environment Variables
- [ ] Restart Backend Server
- [ ] Test GitHub Connection
- [ ] Import First Repository
- [ ] Deploy from GitHub

---

## Step 1: Create GitHub OAuth Application

### On GitHub:

1. Go to **https://github.com/settings/developers** (or GitHub Settings → Developer settings → OAuth Apps)

2. Click **"New OAuth App"**

3. Fill in the form:
   ```
   Application name: Deployer
   Homepage URL: http://localhost:3000 (or your production URL)
   Application description: Deploy from GitHub repositories
   Authorization callback URL: http://localhost:5000/auth/github/callback
   ```

4. Click **"Create OAuth App"**

5. Copy your credentials:
   - **Client ID** 
   - **Client Secret** (keep this secret!)

### For Production:
- Use your production domain instead of localhost
- Authorization callback URL: `https://yourdomain.com/auth/github/callback`

---

## Step 2: Configure Environment Variables

### Backend `.env` file:

Add or update these variables:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=<paste_your_client_id_here>
GITHUB_CLIENT_SECRET=<paste_your_client_secret_here>
GITHUB_WEBHOOK_SECRET=deployer_webhook_secret_123

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
WEBHOOK_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/deployer

# JWT & Session
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### Frontend `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001
```

---

## Step 3: Restart Backend Server

### Terminal:

```bash
# Navigate to server directory
cd server

# Install/update dependencies (if needed)
pnpm install

# Restart the server
pnpm run dev
```

You should see:
```
✓ Server running on http://localhost:5000
✓ Connected to MongoDB
✓ GitHub integration ready
```

---

## Step 4: Test GitHub Connection

### In Your Browser:

1. Go to **http://localhost:3000** (your Deployer frontend)

2. Navigate to **Deployments** page

3. Click **"New Deployment"**

4. Click the **"GitHub"** tab

5. Click **"Select GitHub Repository"**

6. **Expected Result**: GitHub OAuth popup or redirect to login page

7. After authentication, you should see your repositories list

### If it doesn't work:

- Check browser console for errors (F12 → Console)
- Verify GitHub OAuth credentials in `.env`
- Check server logs for API errors
- Ensure backend server is running on port 5000

---

## Step 5: Import First Repository

### User Steps:

1. In the **GitHub Import Dialog**:
   - See your repositories listed
   - Use search to find a specific repo
   - Click to select a repository

2. **Branch Selection**:
   - Branches load automatically
   - Default branch is auto-selected
   - Choose a different branch if desired

3. **Back in Deployment Dialog**:
   - **Project**: Select target project
   - **Environment**: Choose staging/production/development
   - Click **"Create Deployment"**

4. **Result**: Deployment created with GitHub metadata

---

## Step 6: Deploy from GitHub

### Automatic Deployments (Optional):

1. After deployment created, go to deployment details

2. Look for **"Enable Auto-Deployment"** option

3. Click **"Create Webhook"**

4. Future GitHub pushes to that branch will auto-deploy

---

## Troubleshooting

### Issue: "GitHub integration not connected"

**Cause**: User hasn't connected GitHub account yet

**Solution**: 
1. Ensure GitHub OAuth app is created
2. User must click "Select GitHub Repository" to authenticate
3. Grant permissions when asked

### Issue: "No repositories found"

**Cause**: User has no accessible repositories or permission issue

**Solutions**:
1. Verify GitHub OAuth app has `public_repo` scope
2. Check user has access to repositories on GitHub
3. Disconnect and reconnect GitHub account

### Issue: GitHub callback fails with "Unauthorized"

**Cause**: Client Secret mismatch or wrong OAuth app

**Solutions**:
1. Verify `GITHUB_CLIENT_SECRET` is correct
2. Check `GITHUB_CLIENT_ID` matches GitHub app
3. Verify callback URL matches exactly: `http://localhost:5000/auth/github/callback`

### Issue: Branches won't load

**Cause**: GitHub API error or token expired

**Solutions**:
1. Disconnect and reconnect GitHub account
2. Check GitHub API rate limits (60 requests/hour)
3. Verify token hasn't expired

### Issue: Can't see private repositories

**Cause**: OAuth scope doesn't include private repos

**Solutions**:
1. Recreate GitHub OAuth app with proper scopes
2. Scopes needed: `read:user`, `public_repo`, `repo` (for private)

---

## Production Deployment

### Environment Variables:

```env
# Update for production domain
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
WEBHOOK_URL=https://api.yourdomain.com

# GitHub OAuth with production URLs
GITHUB_CLIENT_ID=your_production_client_id
GITHUB_CLIENT_SECRET=your_production_client_secret
GITHUB_WEBHOOK_SECRET=use_strong_random_secret

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/deployer

# Security
NODE_ENV=production
JWT_SECRET=use_long_random_string
```

### GitHub OAuth App Setup:

1. Create separate OAuth app for production
2. Authorization callback URL: `https://yourdomain.com/auth/github/callback`
3. Use production Client ID and Secret

### Server Configuration:

1. Update CORS settings for production domain
2. Enable HTTPS
3. Configure firewall for GitHub webhooks
4. Set up monitoring and logging

---

## API Testing

### Using cURL:

```bash
# Test backend is running
curl http://localhost:5000/health

# Get repositories (requires auth)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/github-provider/repositories

# Get branches
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/github-provider/repositories/owner/repo/branches

# Check connection status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/github-provider/status
```

---

## Database Models

### GitHub Integration Collection:

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Reference to User
  githubUsername: String,        // e.g., "octocat"
  accessToken: String,           // Encrypted
  refreshToken: String,          // Optional
  expiresAt: Date,              // Token expiration
  connectedAt: Date,            // When connected
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security Best Practices

### Token Storage:
- Never commit `.env` files with secrets
- Use environment variables for sensitive data
- Encrypt tokens in database
- Implement token rotation

### Webhook Security:
- Verify GitHub webhook signature
- Use strong `GITHUB_WEBHOOK_SECRET`
- Only process verified webhooks
- Rate limit webhook processing

### OAuth Security:
- Use HTTPS for all OAuth flows
- Never expose client secret in frontend
- Implement CSRF protection
- Validate redirect URLs

### API Security:
- Require authentication for all endpoints
- Use JWT tokens with expiration
- Implement rate limiting
- Log all GitHub API calls

---

## Monitoring & Debugging

### Enable Debug Logging:

```env
# In .env
DEBUG=deployer:*
LOG_LEVEL=debug
```

### Check Logs:

```bash
# Backend logs
tail -f server/logs/app.log

# GitHub API rate limit
curl -H "Authorization: Bearer TOKEN" https://api.github.com/rate_limit
```

### Monitor Deployments:

1. Dashboard → Deployments
2. Check deployment status
3. View deployment logs
4. Check GitHub webhook events

---

## Next Steps

1. ✅ Complete setup above
2. ✅ Test GitHub connection
3. ✅ Deploy from GitHub
4. ✅ Enable auto-deployment
5. ✅ Configure environment variables
6. ✅ Set up production deployment

---

## Support & Resources

### Documentation:
- [GitHub Integration Guide](./GITHUB_INTEGRATION_GUIDE.md)
- [Architecture Diagram](./GITHUB_INTEGRATION_ARCHITECTURE.md)
- [API Reference](./API_ROUTES.md)

### GitHub API Docs:
- [GitHub REST API](https://docs.github.com/en/rest)
- [OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks)

### External Resources:
- [Netlify Deployment Flow](https://docs.netlify.com/site-deploys/create-deploys/)
- [GitHub OAuth Flow](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)

---

## Checklist for Going Live

- [ ] GitHub OAuth app created
- [ ] Environment variables configured
- [ ] Backend server running and healthy
- [ ] Frontend connects to GitHub successfully
- [ ] Can browse user's repositories
- [ ] Can select branch and deploy
- [ ] Deployment creates successfully
- [ ] Logs appear in deployment details
- [ ] (Optional) Webhooks working for auto-deploy
- [ ] Error handling tested
- [ ] HTTPS enabled (production)
- [ ] Monitoring configured
- [ ] Documentation reviewed
