# GitHub Integration - Deployment Page Troubleshooting

## Issue
Repositories list is not showing in the deployment dialog after clicking "Connect GitHub" button.

## Root Cause Analysis

The problem likely occurs at one of these stages:

```
1. Click "Connect GitHub"
   ↓
2. Redirect to GitHub OAuth
   ↓
3. User authorizes app
   ↓
4. GitHub redirects back to /auth/github/callback ← CRITICAL POINT
   ↓
5. Access token saved to GitHubIntegration collection ← MIGHT FAIL HERE
   ↓
6. Redirect to frontend
   ↓
7. User opens deployment dialog
   ↓
8. Frontend checks connection status (getGitHubConnectionStatus)
   ↓
9. If connected, fetch repositories (getGitHubRepositories) ← MIGHT FAIL HERE
   ↓
10. Show list of repositories
```

## Quick Test (Step-by-Step)

### Step 1: Check Environment Variables
```bash
# In your .env or server/.env, verify:
GITHUB_CLIENT_ID=your_actual_client_id
GITHUB_CLIENT_SECRET=your_actual_client_secret
API_URL=http://localhost:5000          # MUST match OAuth app callback URL
CLIENT_URL=http://localhost:3000       # For frontend redirects
```

### Step 2: Fresh Start
```bash
# Kill all running servers
# Open new terminal windows

# Terminal 1 - Start backend
cd server
npm install
npm run dev
# Should see: "Server running on port 5000"

# Terminal 2 - Start frontend
npm run dev
# Should see: "▲ Next.js ... ready in ..."
```

### Step 3: Test OAuth Flow
1. Open http://localhost:3000
2. Login (or create account)
3. Go to a deployment page
4. Click "New Deployment" button
5. Select "GitHub" tab
6. Click "Connect GitHub" button
7. **Stay on this step and check server logs** (Terminal 1)

### Step 4: Check Server Logs During OAuth

**Look for these messages:**

✅ **Expected logs after authorization:**
```
GitHub OAuth Callback - Saving integration for user: [USER_ID]
GitHub username: your-github-username
Access token present: true
GitHub integration saved successfully
```

❌ **If you see these errors:**
```
TypeError: Cannot read property 'accessToken' of undefined
    at githubCallback
```
→ Passport strategy is NOT passing accessToken

```
MongoError: write failed: ...
```
→ Database connection issue

### Step 5: Open Browser DevTools and Test Manually

**Press F12 → Console Tab**, then run:

```javascript
// Test 1: Check connection status
fetch('/api/github-provider/status', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Expected response:
```json
{
  "connected": true,
  "username": "your-github-username",
  "avatar": "https://avatars.githubusercontent.com/u/...",
  "connectedAt": "2025-11-04T..."
}
```

If you get `{ connected: false }`, the integration wasn't saved to database.

```javascript
// Test 2: Fetch repositories
fetch('/api/github-provider/repositories', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Expected response:
```json
[
  {
    "id": 123456,
    "name": "my-repo",
    "fullName": "username/my-repo",
    "owner": "username",
    "isPrivate": false,
    "stars": 5,
    "defaultBranch": "main"
  },
  // ... more repos
]
```

If you get an error, check the error message in DevTools.

### Step 6: Diagnose Based on Error

**Error: "GitHub integration not connected"**
```
Cause: No GitHubIntegration record in database
Solution: 
  1. Check server logs during OAuth
  2. Verify MongoDB connection
  3. Verify authController is saving the integration
```

**Error: "401 Unauthorized"**
```
Cause: Access token is invalid or expired
Solution:
  1. Disconnect GitHub in settings
  2. Reconnect GitHub
  3. Make sure you authorize all permissions
```

**Error: "403 Forbidden"**
```
Cause: Token doesn't have enough permissions (missing 'repo' scope)
Solution:
  1. Disconnect GitHub
  2. Verify OAuth route has correct scopes:
     server/routes/auth.js line 21:
     scope: ["user:email", "repo", "read:user"]
  3. Reconnect GitHub
```

**Error: "404 Not Found" on /api/github-provider/repositories**
```
Cause: Backend route not registered
Solution:
  1. Check server/index.js includes:
     app.use("/api/github-provider", githubProviderRoutes)
  2. Restart backend
```

---

## Detailed Debugging Steps

### Database Check
```bash
# Connect to MongoDB
# In MongoDB Compass or CLI:

# Show all collections
show collections

# Check if GitHubIntegration exists
db.githubintegrations.find()

# Should return something like:
# {
#   "_id": ObjectId(...),
#   "userId": ObjectId(...),
#   "githubUsername": "your-username",
#   "accessToken": "ghu_xxxxx...",
#   "connectedAt": ISODate("2025-11-04T...")
# }
```

### Manual API Test
```bash
# Get your access token from browser (after OAuth)
# Then test directly:

curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://api.github.com/user/repos?per_page=10

# Should return JSON array of repositories
```

### Check Network Requests
1. Open DevTools → Network tab
2. Filter: XHR
3. Look for requests to:
   - `/api/github-provider/status` → Should return 200
   - `/api/github-provider/repositories` → Should return 200 with array of repos
4. Check "Response" tab to see actual data
5. If getting error, check "Console" tab for error details

---

## Code Verification

### 1. Verify Passport Strategy Has accessToken
File: `server/config/passport.js` line 93

Should have:
```javascript
return done(null, { user, profile, accessToken })  // ← accessToken included
```

NOT:
```javascript
return done(null, { user, profile })  // ← Missing accessToken
```

### 2. Verify Controller Receives accessToken
File: `server/controllers/authController.js` line 290

Should have:
```javascript
const { profile, accessToken } = req.user  // ← Destructure accessToken
```

NOT:
```javascript
const { profile } = req.user  // ← Missing accessToken
```

### 3. Verify Integration is Saved
File: `server/controllers/authController.js` line 365

Should have:
```javascript
const GitHubIntegration = require("../models/GitHubIntegration")
await GitHubIntegration.findOneAndUpdate(
  { userId: user._id },
  {
    userId: user._id,
    githubUsername: username,
    accessToken: accessToken,  // ← Token saved
    connectedAt: new Date(),
  },
  { upsert: true, new: true }
)
```

### 4. Verify Routes are Registered
File: `server/index.js` line 141

Should have:
```javascript
app.use("/api/github-provider", githubProviderRoutes)
```

---

## Common Fixes

### Fix 1: Clear Cache and Try Again
```bash
# Stop both servers (Ctrl+C)

# Clear browser cache
# DevTools → Application → Clear storage → Clear site data

# Restart servers
npm run dev
```

### Fix 2: Disconnect and Reconnect
```bash
# In browser DevTools Console:
fetch('/api/github-provider/disconnect', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)

# Then reload page and reconnect GitHub
```

### Fix 3: Update OAuth App Settings
```
Go to https://github.com/settings/developers
→ OAuth Apps
→ Select your app
→ Update "Authorization callback URL" to:
   http://localhost:5000/auth/github/callback  (for local)
   OR
   https://your-domain.com/auth/github/callback (for production)
```

### Fix 4: Check Token Storage
```bash
# In server terminal, after connecting GitHub:
# You should see these logs:

GitHub OAuth Callback - Saving integration for user: [ID]
GitHub username: your-username
Access token present: true
GitHub integration saved successfully

# If you don't see these, the flow is failing before we save
```

---

## Step to Enable Console Logging

The code now has comprehensive logging. To see it:

1. **Start backend** in debug mode:
```bash
cd server
NODE_DEBUG=* npm run dev
# Or just
npm run dev
```

2. **After clicking "Connect GitHub"**:
   - Check terminal output
   - You'll see detailed logs

3. **After OAuth redirect**:
   - Look for "GitHub OAuth Callback" messages
   - Look for "Saving integration" messages

4. **When opening deployment dialog**:
   - Look for "Checking GitHub connection"
   - Look for "Fetching repositories"

---

## What to Share if Still Not Working

Run these commands and share the output:

```bash
# 1. Check environment
echo $GITHUB_CLIENT_ID
echo $GITHUB_CLIENT_SECRET
echo $API_URL

# 2. Check if routes are registered
curl http://localhost:5000/api/github-provider/status

# 3. Check database
# Connect to MongoDB and run:
db.githubintegrations.find()
```

Then share:
1. The terminal logs when you click "Connect GitHub"
2. The error from DevTools Console
3. The database output
4. The curl response

---

## If All Else Fails

Try this nuclear option (reset everything):

```bash
# 1. Delete all localStorage
# DevTools → Application → Storage → Clear site data

# 2. Delete GitHub integration from database
db.githubintegrations.deleteMany({})

# 3. Logout from app
# Click logout or clear cookies

# 4. Stop and restart servers
# Ctrl+C in both terminals

# 5. Start from beginning
npm run dev
# Then test OAuth flow again
```

