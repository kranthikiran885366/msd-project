# Debugging GitHub Integration Issue

## Problem
Repositories not showing on the deployment page when clicking "Connect GitHub" button.

## Checklist to Debug

### 1. Check OAuth Flow Completion
After clicking "Connect GitHub" and returning from GitHub authorization:

**In Browser DevTools Console (F12):**
```javascript
// Check if user is authenticated
const response = await fetch('/api/auth/profile', {
  credentials: 'include'
});
const user = await response.json();
console.log('Current user:', user);
```

Expected: Should show logged-in user details

### 2. Check if GitHub Integration was Saved
```javascript
// Check connection status
const status = await fetch('/api/github-provider/status', {
  credentials: 'include'
});
const data = await status.json();
console.log('GitHub connection:', data);
```

Expected: Should return `{ connected: true, username: "your-github-username", avatar: "...", connectedAt: "..." }`

If returns `{ connected: false }`, the integration wasn't saved to the database.

### 3. Check if Repositories can be Fetched
```javascript
// Try to fetch repositories
const repos = await fetch('/api/github-provider/repositories', {
  credentials: 'include'
});
const data = await repos.json();
console.log('Repositories:', data);
```

Expected: Should return array of repositories like:
```json
[
  {
    "id": 123456,
    "name": "my-repo",
    "fullName": "username/my-repo",
    "description": "...",
    "owner": "username",
    "isPrivate": false,
    "language": "JavaScript",
    "stars": 10,
    "defaultBranch": "main"
  }
]
```

### 4. Check Backend Logs
In terminal where server is running:
```bash
npm run dev
# or
node server/index.js
```

Look for:
- **OAuth Callback Errors**: Any errors in `authController.githubCallback`
- **API Errors**: Check if `/api/github-provider/repositories` is being called
- **Database Errors**: Check if `GitHubIntegration` is being created

### 5. Common Issues & Solutions

#### Issue A: "GitHub integration not connected"
**Cause**: `GitHubIntegration` record not created in database

**Solution**:
1. Check MongoDB connection is working
2. Verify authController is creating the integration:
   ```javascript
   // In authController.js, after line 365
   console.log('Saving GitHub integration for user:', user._id);
   ```
3. Check if `accessToken` is being passed from Passport

#### Issue B: "401 Unauthorized" when fetching repos
**Cause**: User session lost after OAuth redirect

**Solution**:
1. Check if JWT token is being sent correctly:
   ```javascript
   // In DevTools, check if Authorization header is present
   // Network tab → any API request → Headers → Authorization: Bearer ...
   ```
2. Verify token is being stored in localStorage/cookies after OAuth redirect

#### Issue C: GitHub API Rate Limit
**Cause**: Too many API requests

**Solution**:
1. Add caching to repositories endpoint
2. Check GitHub rate limit:
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     https://api.github.com/rate_limit
   ```

#### Issue D: Wrong OAuth Scope
**Cause**: Token doesn't have `repo` scope

**Solution**:
1. Disconnect and reconnect GitHub
2. Make sure you accept all permissions when GitHub asks
3. Verify in server/routes/auth.js that scope includes: `["user:email", "repo", "read:user"]`

---

## Step-by-Step Debugging

### 1. Start Fresh
```bash
# Open DevTools (F12)
# Go to Application/Storage
# Clear all cookies and localStorage
# Refresh page
# Logout if logged in
```

### 2. Test OAuth Connection
- Click "Connect GitHub" button
- Authorize the app on GitHub
- After redirect, open DevTools Console
- Run the checks above

### 3. If Still Not Working

**Check the auth callback route:**
```javascript
// server/routes/auth.js
// Make sure callback URL matches exactly
router.get("/github/callback", ...)
```

**Check environment variables:**
```bash
# .env or server/.env
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
API_URL=http://localhost:5000  # Must match GitHub OAuth app settings
```

**Check MongoDB:**
```bash
# If using MongoDB Atlas or local MongoDB
# Make sure the database is accessible
# Check if GitHubIntegration collection exists
```

---

## Additional Fixes to Apply

If the above doesn't work, we may need to:

1. **Add console logging to authController**:
   ```javascript
   console.log('GitHub OAuth callback - accessToken:', accessToken ? 'present' : 'MISSING');
   console.log('Saving to GitHubIntegration for user:', user._id);
   ```

2. **Add error handling to GitHub API calls**:
   ```javascript
   // If GitHub API returns error, log it
   console.error('GitHub API error:', error.response?.status, error.response?.data);
   ```

3. **Test with curl**:
   ```bash
   # Manually test the endpoint
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/github-provider/repositories
   ```

---

## Next Steps

1. Run the debug checks above
2. Share any error messages from DevTools or server logs
3. We can add more logging if needed
4. May need to check database directly to see if GitHubIntegration is being created

