# Complete Configuration Guide with Screenshots

## Table of Contents
1. [GitHub OAuth Setup](#github-oauth-setup)
2. [Google OAuth Setup](#google-oauth-setup)
3. [Render Environment Configuration](#render-environment-configuration)
4. [Vercel Configuration](#vercel-configuration)
5. [Testing & Verification](#testing--verification)

---

## GitHub OAuth Setup

### Step 1: Access GitHub OAuth Settings
**Location**: https://github.com/settings/developers → OAuth Apps

**Screenshot Reference Points**:
- Find "OAuth Apps" in the left sidebar under "Developer settings"
- Click "New OAuth App" button

### Step 2: Create or Edit Your OAuth App
**App Name**: `msd-project` (or your preferred name)

**Required Fields**:
```
Homepage URL:           https://kranthi-project-deployer.vercel.app
Authorization callback: https://msd-project-8c1o.onrender.com/auth/github/callback
```

**For Local Development (Add Additional)**:
```
Authorization callback: http://localhost:5000/auth/github/callback
```

### Step 3: Copy Your Credentials
**Screenshot Areas to Capture**:
- `Client ID` - Copy this value
- `Client Secret` - Click "Generate a new client secret" and copy

**Store These In** (do not commit to repo):
```env
GITHUB_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET
```

### Step 4: Verify Callback URLs
**Screenshot Checklist**:
- [ ] Authorization callback URL shows both:
  - `https://msd-project-8c1o.onrender.com/auth/github/callback`
  - `http://localhost:5000/auth/github/callback` (optional, for local dev)
- [ ] Homepage URL is correct: `https://kranthi-project-deployer.vercel.app`

---

## Google OAuth Setup

### Step 1: Access Google Cloud Console
**Location**: https://console.cloud.google.com/

**Screenshot Reference Points**:
- Select or create a project
- Go to "APIs & Services" in left sidebar
- Click on "Credentials"

### Step 2: Create OAuth 2.0 Client ID
**Screenshot Steps**:
1. Click "Create Credentials" → "OAuth 2.0 Client ID"
2. Choose "Web application"
3. Click "Create"

### Step 3: Configure Authorized Redirect URIs
**Add Both URLs**:
```
Production:  https://msd-project-8c1o.onrender.com/auth/google/callback
Development: http://localhost:5000/auth/google/callback
```

**Screenshot Area**:
- Look for "Authorized redirect URIs" section
- Add each URL and save

### Step 4: Download and Store Credentials
**Screenshot Capture**:
- Copy `Client ID` and `Client Secret` from the credentials modal

**Store In** (do not commit to repo):
```env
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET
```

---

## Render Environment Configuration

### Step 1: Access Render Dashboard
**Location**: https://dashboard.render.com/

**Screenshot Reference**:
- Select service: `msd-project-8c1o`
- Click on "Environment" tab

### Step 2: Add Environment Variables
**Set These Variables** in Render Dashboard:

| Variable Name | Value | Source |
|---|---|---|
| `API_URL` | `https://msd-project-8c1o.onrender.com` | Fixed |
| `CLIENT_URL` | `https://kranthi-project-deployer.vercel.app` | Fixed |
| `NODE_ENV` | `production` | Fixed |
| `MONGODB_URI` | `mongodb+srv://kranthi:kranthi%401234@cluster0.ycbgnbj.mongodb.net/?appName=Cluster0` | From Render settings |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-in-production` | Generate new |
| `GITHUB_CLIENT_ID` | `YOUR_ACTUAL_CLIENT_ID` | From GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | `YOUR_ACTUAL_CLIENT_SECRET` | From GitHub OAuth |
| `GOOGLE_CLIENT_ID` | `YOUR_ACTUAL_CLIENT_ID` | From Google Cloud |
| `GOOGLE_CLIENT_SECRET` | `YOUR_ACTUAL_CLIENT_SECRET` | From Google Cloud |

**Screenshot Steps**:
1. Click "Add Environment Variable" for each
2. Enter Variable name
3. Enter Value
4. Click "Save"
5. Service will auto-redeploy

### Step 3: Verify Variables Are Set
**Screenshot Check**:
- All variables appear in the Environment section
- No red error indicators
- Green checkmark next to each variable

---

## Vercel Configuration

### Step 1: Access Vercel Project Settings
**Location**: https://vercel.com/projects

**Screenshot Steps**:
1. Select `kranthi-project-deployer`
2. Click "Settings"
3. Go to "Environment Variables"

### Step 2: Add Frontend Environment Variables
**Set These Variables**:

| Variable Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://msd-project-8c1o.onrender.com` | Production, Preview, Development |
| `NEXT_PUBLIC_CLIENT_URL` | `https://kranthi-project-deployer.vercel.app` | Production |
| `API_URL` | `https://msd-project-8c1o.onrender.com` | Production |
| `CLIENT_URL` | `https://kranthi-project-deployer.vercel.app` | Production |

**Screenshot Guide**:
1. Each variable should be added with proper scope
2. Select checkboxes for: Production, Preview, Development
3. Click "Save"

### Step 3: Verify Deployment
**Screenshot Check**:
- Deployments page shows latest build: ✅ READY
- Build logs show no errors
- Environment variables are visible in "Settings" → "Environment Variables"

---

## Testing & Verification

### Test 1: Check Backend Health
**URL**: https://msd-project-8c1o.onrender.com/health

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-03T12:34:56.789Z"
}
```

**Screenshot**: Browser showing JSON response

### Test 2: Check Configuration Endpoint
**URL**: https://msd-project-8c1o.onrender.com/config/check

**Expected Response**:
```json
{
  "api_url": "https://msd-project-8c1o.onrender.com",
  "client_url": "https://kranthi-project-deployer.vercel.app",
  "node_env": "production",
  "github_client_id": "set",
  "github_client_secret": "set",
  "google_client_id": "set",
  "google_client_secret": "set"
}
```

**Screenshot**: Confirm all values show "set"

### Test 3: Test GitHub OAuth Flow
**Steps**:
1. Visit: https://kranthi-project-deployer.vercel.app/
2. Click "Sign in" or "Get started"
3. Click "Sign in with GitHub"
4. **Screenshot Points**:
   - GitHub authorization page appears
   - After approval, redirects to dashboard
   - User logged in with GitHub profile

### Test 4: Test Google OAuth Flow
**Steps**:
1. Visit: https://kranthi-project-deployer.vercel.app/
2. Look for "Sign in with Google" button
3. Click it
4. **Screenshot Points**:
   - Google consent screen appears
   - After approval, redirects to dashboard
   - User logged in with Google profile

### Test 5: Check API Connection
**Via Frontend Console**:
```javascript
fetch('https://msd-project-8c1o.onrender.com/api/projects', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
.then(r => r.json())
.then(console.log)
```

**Screenshot**: Browser console showing API response

---

## Troubleshooting Guide

### Issue: 404 on GitHub Callback
**Cause**: Callback URL doesn't match GitHub OAuth settings

**Solution**:
1. Check GitHub OAuth app settings
2. Verify callback URL: `https://msd-project-8c1o.onrender.com/auth/github/callback`
3. **Screenshot**: Compare GitHub settings with error message

### Issue: 401 Unauthorized on OAuth
**Cause**: Missing or incorrect Client ID/Secret

**Solution**:
1. Check Render environment variables
2. Run: `https://msd-project-8c1o.onrender.com/config/check`
3. Verify all OAuth credentials show "set"
4. **Screenshot**: Show config/check endpoint response

### Issue: CORS Error
**Cause**: Frontend URL not allowed on backend

**Solution**:
1. Check `server/index.js` CORS configuration
2. Verify `CLIENT_URL` is in allowedOrigins
3. **Screenshot**: Browser network tab showing CORS error

### Issue: Redirect Loop on Auth Callback
**Cause**: `CLIENT_URL` not set correctly

**Solution**:
1. Check Render environment variables
2. Verify `CLIENT_URL=https://kranthi-project-deployer.vercel.app`
3. Check frontend `.env.production`
4. **Screenshot**: Browser showing redirect chain in DevTools Network tab

---

## Configuration Checklist

### GitHub OAuth ✓
- [ ] OAuth App created at https://github.com/settings/developers
- [ ] Client ID: `Ov23likurvcQURsPd8YX`
- [ ] Client Secret: Stored securely
- [ ] Callback URLs configured (both prod and local)
- [ ] **Screenshot**: GitHub OAuth app page

### Google OAuth ✓
- [ ] OAuth 2.0 Client created in Google Cloud
- [ ] Client ID: `734157965900-...`
- [ ] Client Secret: Stored securely
- [ ] Redirect URIs configured (both prod and local)
- [ ] **Screenshot**: Google Cloud credentials page

### Render Backend ✓
- [ ] Service: `msd-project-8c1o` running
- [ ] All environment variables set:
  - `API_URL` ✓
  - `CLIENT_URL` ✓
  - `GITHUB_CLIENT_ID` ✓
  - `GITHUB_CLIENT_SECRET` ✓
  - `GOOGLE_CLIENT_ID` ✓
  - `GOOGLE_CLIENT_SECRET` ✓
- [ ] Health check passes: https://msd-project-8c1o.onrender.com/health
- [ ] **Screenshot**: Render dashboard showing all variables

### Vercel Frontend ✓
- [ ] Project: `kranthi-project-deployer` deployed
- [ ] Environment variables set:
  - `NEXT_PUBLIC_API_URL` ✓
  - `NEXT_PUBLIC_CLIENT_URL` ✓
- [ ] Latest deployment status: READY
- [ ] **Screenshot**: Vercel dashboard showing deployment

### Live Testing ✓
- [ ] Frontend loads: https://kranthi-project-deployer.vercel.app
- [ ] GitHub OAuth works
- [ ] Google OAuth works
- [ ] Dashboard accessible after login
- [ ] API calls successful
- [ ] **Screenshot**: Dashboard page after successful login

---

## Live URLs for Reference

| Component | URL | Screenshot |
|---|---|---|
| **Frontend** | https://kranthi-project-deployer.vercel.app | Home page |
| **Backend Health** | https://msd-project-8c1o.onrender.com/health | JSON response |
| **Config Check** | https://msd-project-8c1o.onrender.com/config/check | All "set" |
| **GitHub OAuth App** | https://github.com/settings/developers | Settings page |
| **Google Cloud Console** | https://console.cloud.google.com | Credentials |
| **Render Dashboard** | https://dashboard.render.com | Environment vars |
| **Vercel Dashboard** | https://vercel.com/projects | Deployment status |

---

## Next Steps

1. **Capture Screenshots**: Take screenshots of each configuration page
2. **Organize Screenshots**: Place in a `docs/screenshots/` folder
3. **Update This Document**: Link each "**Screenshot**" reference to actual images
4. **Create Video Walkthrough**: Optional - record step-by-step setup
5. **Share with Team**: Update documentation with team members

---

## Document Version
- **Last Updated**: November 3, 2025
- **Version**: 1.0 (with screenshot placeholders)
- **Status**: Ready for screenshot capture and finalization

---

## Example Screenshot Structure
```
docs/screenshots/
├── 01-github-oauth-settings.png
├── 02-github-create-oauth-app.png
├── 03-github-callback-urls.png
├── 04-google-cloud-credentials.png
├── 05-google-redirect-uris.png
├── 06-render-environment-variables.png
├── 07-vercel-environment-variables.png
├── 08-backend-health-check.png
├── 09-config-check-endpoint.png
├── 10-github-oauth-flow.png
├── 11-google-oauth-flow.png
├── 12-dashboard-after-login.png
└── 13-api-test-console.png
```

---

## Contact & Support
- **GitHub Repo**: https://github.com/kranthikiran885366/msd-project
- **Frontend**: https://kranthi-project-deployer.vercel.app
- **Backend**: https://msd-project-8c1o.onrender.com
