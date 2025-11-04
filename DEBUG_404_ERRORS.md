# 404 Error - Complete Understanding & Troubleshooting Guide

## What is a 404 Error?

**404 Not Found** - The server understood the request but cannot find the requested resource.

### Error Components:
```
Failed to load resource: the server responded with a status of 404
├── "Failed to load resource" = Browser couldn't get the file/data
├── "server responded" = Server received the request
└── "status of 404" = Resource doesn't exist at that location
```

## Common Causes

### 1. **Wrong URL Path** ❌
```javascript
// Requested
GET /api/users/123

// Actual endpoint
GET /api/user/123  // Missing 's'
```

**Fix**: Verify the exact URL path in your API documentation

### 2. **Missing API Route** ❌
```javascript
// Server has:
GET /api/projects

// But you're calling:
GET /api/projects/123/deploy  // This route doesn't exist
```

**Fix**: Check which routes are registered in the server

### 3. **File Not Found** ❌
```html
<!-- Trying to load image from wrong path -->
<img src="/images/logo.png">

<!-- But file is actually at -->
/public/images/logo.png
```

**Fix**: Ensure paths are correct relative to your public/static folder

### 4. **Typo in Filename** ❌
```
Trying to load: /styles/stye.css  ← Typo
Actual file:   /styles/style.css
```

**Fix**: Double-check file names and extensions

### 5. **Backend Not Running** ❌
```
Frontend tries: GET http://localhost:5000/api/data
Backend:       Not running or on different port
Result:        404 (or connection refused)
```

**Fix**: Verify backend server is running and accessible

## How to Diagnose 404 Errors

### Step 1: Check Browser Console
```
Press: F12 or Right-click → Inspect → Console/Network tabs
```

Look for:
- **Network tab**: Shows which request got 404
- **URL**: The exact path being requested
- **Status**: 404 confirmation
- **Request headers**: Method (GET/POST/etc)

### Step 2: Identify the Request
```
Example error in console:
GET http://localhost:3000/api/billing/plans 404
     ↑ Method              ↑ Full URL          ↑ Status
```

### Step 3: Check if Path Exists

**For API endpoints:**
```bash
# Check if endpoint is registered
curl -X GET http://localhost:5000/api/billing/plans
```

**For files:**
```bash
# Check if file exists
ls -la public/images/logo.png
```

## Common 404 Scenarios in This Project

### Scenario 1: Billing API Missing
```javascript
// Frontend calls
fetch('/api/billing/plans')

// But server might not have registered this route
// Solution: Check server/index.js for route registration
```

**Check**: `server/index.js` for:
```javascript
app.use("/api/billing", billingRoutes)
```

### Scenario 2: Static Asset 404
```html
<!-- Trying to load -->
<img src="/logo.png">

<!-- But should be -->
<img src="/public/logo.png">
<!-- or -->
<img src={require('@/public/logo.png')}> // Next.js way
```

### Scenario 3: Next.js Page Not Found
```
// URL
http://localhost:3000/nonexistent-page

// No matching route in app/ directory
// Solution: Create the page file
```

### Scenario 4: API Route Mismatch
```javascript
// Frontend sends to:
POST /api/deployments/create

// Server expects:
POST /api/deployments
```

## How to Fix 404 Errors

### For API Endpoints:

1. **Check Route Registration**
```javascript
// server/index.js
app.use("/api/billing", billingRoutes)  // Make sure this exists
```

2. **Verify Controller Method**
```javascript
// server/controllers/billingController.js
async getPlans(req, res) {  // Method must exist
  // ...
}
```

3. **Check Route Mapping**
```javascript
// server/routes/billing.js
router.get('/plans', billingController.getPlans)  // Correct path
```

4. **Test with curl**
```bash
curl -X GET http://localhost:5000/api/billing/plans
```

### For Static Files:

1. **Use Correct Path**
```javascript
// Next.js
<img src="/logo.png" alt="Logo" />
// File must be at: public/logo.png
```

2. **Check Public Folder**
```bash
# Verify file exists
ls -la public/logo.png

# Move file if needed
mv logo.png public/
```

### For Next.js Pages:

1. **Create Missing Page**
```bash
# If getting 404 on /dashboard
# Create: app/dashboard/page.jsx
```

## Debugging Checklist

- [ ] **Backend Running?** Check `http://localhost:5000/health`
- [ ] **Frontend Running?** Check `http://localhost:3000`
- [ ] **Correct URL?** Match exactly with route definitions
- [ ] **Correct Method?** GET, POST, PUT, DELETE?
- [ ] **File Exists?** Check public/, server/controllers/, etc.
- [ ] **Route Registered?** Check server/index.js
- [ ] **Controller Exists?** Check server/controllers/
- [ ] **Permission Issues?** Check file permissions
- [ ] **Port Correct?** Is server on 5000, frontend on 3000?

## Testing in This Project

### Test Health Endpoint
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","timestamp":"..."}
# If 404: Server not running or wrong port
```

### Test Billing API
```bash
curl http://localhost:5000/api/billing/plans
# Should return: {"success":true,"data":[...]}
# If 404: Route not registered
```

### Test MongoDB Connection
```bash
curl http://localhost:5000/health
# Check server logs for MongoDB connection
```

## Server Routes in This Project

**Registered Routes:**
```
✅ GET  /health                    - Health check
✅ GET  /version                   - Version info
✅ GET  /config/check              - Configuration
✅ GET  /api/billing/plans         - List plans
✅ GET  /api/billing/subscriptions - Get subscription
✅ POST /api/billing/subscribe     - Create subscription
✅ GET  /api/deployments           - List deployments
✅ POST /api/deployments           - Create deployment
✅ And many more...
```

**Unregistered (404 if called):**
```
❌ GET /invalid/path
❌ POST /nonexistent
❌ GET /typo/route
```

## Quick Fix Steps

1. **Check Network Tab**
   - Open DevTools (F12)
   - Go to Network tab
   - Reload page
   - Look for red 404 requests
   - Click on request to see URL

2. **Verify Exact URL**
   ```
   Note the exact path and method
   Example: GET /api/billing/plans?filter=active
   ```

3. **Test in Terminal**
   ```bash
   # Use the exact URL from Network tab
   curl "http://localhost:5000/api/billing/plans?filter=active"
   ```

4. **Check if Endpoint Exists**
   - Look in `server/routes/` for matching file
   - Look in `server/controllers/` for method
   - Verify path exactly matches

5. **Restart Servers if Needed**
   ```bash
   # Terminal 1 (Frontend)
   npm run dev
   
   # Terminal 2 (Backend)
   cd server && npm run dev
   ```

## When You See 404

| Check | Action | Expected |
|-------|--------|----------|
| Is backend running? | Check logs | `Server running on port 5000` |
| Is URL correct? | Copy from Network tab | Match route in server |
| Is file there? | `ls -la` path | File exists |
| Is route registered? | Check server/index.js | `app.use(...)` exists |
| Is method right? | Check controller | Method returns response |

## Prevention Tips

✅ **Always check Network tab** before investigating
✅ **Verify URL spelling** character by character
✅ **Restart servers** after code changes
✅ **Use consistent naming** for routes and files
✅ **Document API** routes in comments
✅ **Test endpoints** with curl before using in code
✅ **Check file permissions** if accessing static files
✅ **Use absolute paths** in require/import statements

## Example: Full Debugging Process

```
Error: GET /api/billing/plans 404

Step 1: Copy exact URL from Network tab
        http://localhost:5000/api/billing/plans

Step 2: Test in terminal
        curl http://localhost:5000/api/billing/plans
        Result: 404

Step 3: Check if backend running
        ps aux | grep node
        Check for "node index.js" in server/

Step 4: Verify route exists
        grep -r "billing" server/index.js
        Should see: app.use("/api/billing", billingRoutes)

Step 5: Check route file
        cat server/routes/billing.js
        Should have: router.get('/plans', ...)

Step 6: Check controller
        cat server/controllers/billingController.js
        Should have: getPlans() method

Step 7: Restart and test again
        cd server && npm run dev
        curl http://localhost:5000/api/billing/plans
```

## Still Getting 404?

1. **Server logs** - Check console for errors
2. **File exists?** - Manually verify file path
3. **Syntax errors?** - Check for JavaScript errors in code
4. **Port conflict?** - Is another app using port 5000?
5. **Environment vars** - Ensure all needed env vars set
6. **Dependency missing** - Run `npm install` in both root and server

---

**Need more help?** Check the exact error message and run the debugging checklist above!
