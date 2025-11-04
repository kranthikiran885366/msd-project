# GitHub Integration - Quick Diagnostics

## Follow These Steps to Find the Issue

### Step 1: Start Server with Debug Output
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Look for these messages when you test OAuth
```

### Step 2: Test OAuth in Browser

```
1. Open http://localhost:3000
2. Login to your account
3. Go to deployments page
4. Click "New Deployment" button
5. Click "GitHub" tab
6. Click "Connect GitHub" button
7. Authorize on GitHub
8. **Wait for redirect back to app**
```

### Step 3: Check Server Terminal Output

**Copy the logs that appear and look for:**

#### ✅ GOOD - You should see:
```
GitHub OAuth Callback - Saving integration for user: [USER_ID]
GitHub username: your-github-username
Access token present: true
GitHub integration saved successfully
```

#### ❌ BAD - If you see any of these:

**Error A:**
```
Cannot read property 'accessToken' of undefined
```
→ **Issue**: Passport not passing accessToken
→ **Fix**: Check server/config/passport.js line 93

**Error B:**
```
MongoError: connect ECONNREFUSED 127.0.0.1:27017
```
→ **Issue**: MongoDB not running
→ **Fix**: Start MongoDB

**Error C:**
```
GitHub integration not connected (when fetching repos)
```
→ **Issue**: Record not saved to database
→ **Fix**: Check if OAuth callback logs show errors

### Step 4: Check Browser DevTools

**Press F12 → Console tab**

Run this command:
```javascript
fetch('/api/github-provider/status', { credentials: 'include' })
  .then(r => r.json())
  .then(data => console.log('Status:', data))
  .catch(err => console.error('Error:', err))
```

**Expected output:**
```json
Status: {
  connected: true,
  username: "your-github-username",
  avatar: "https://...",
  connectedAt: "2025-11-04T..."
}
```

**If you see:**
```json
Status: { connected: false }
```
→ The GitHubIntegration wasn't saved

### Step 5: Test Repository Fetching

Run in DevTools Console:
```javascript
fetch('/api/github-provider/repositories', { credentials: 'include' })
  .then(r => r.json())
  .then(data => console.log('Repos:', data))
  .catch(err => console.error('Error:', err))
```

**Expected: Array of repos**
```json
Repos: [
  {
    id: 123456,
    name: "my-repo",
    fullName: "username/my-repo",
    ...
  },
  // more repos
]
```

**If you see error**:
- Check the error message
- Look at Network tab in DevTools
- Click on `/api/github-provider/repositories` request
- Check "Response" tab for error details

---

## Likely Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| Connection shows false | Disconnect in GitHub settings, reconnect |
| 401 Unauthorized | Token expired, reconnect GitHub |
| 403 Forbidden | Missing `repo` scope, reconnect GitHub |
| MongoDB connection failed | Start MongoDB |
| Can't find route | Restart backend server |
| No logs in terminal | Check you're running `npm run dev` in server folder |

---

## What to Share if Still Not Working

Please provide:

1. **Server logs** when clicking "Connect GitHub" (copy full output)
2. **Error from DevTools Console** (F12 → Console, any red messages)
3. **Result of this test:**
   ```javascript
   fetch('/api/github-provider/status', { credentials: 'include' })
     .then(r => r.json())
     .then(console.log)
   ```
4. **Result of this test:**
   ```javascript
   fetch('/api/github-provider/repositories', { credentials: 'include' })
     .then(r => r.json())
     .then(console.log)
   ```

Then I can pinpoint exactly where the issue is!

