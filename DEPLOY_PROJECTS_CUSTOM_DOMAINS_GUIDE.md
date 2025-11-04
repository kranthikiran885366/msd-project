# Deploy Projects on Custom Domains - Complete Guide

## Overview

This guide shows how to set up repository imports and deploy projects on custom domains, just like Netlify and Render.

## Table of Contents
1. [Import Repository](#import-repository)
2. [Configure Build Settings](#configure-build-settings)
3. [Set Environment Variables](#set-environment-variables)
4. [Deploy to Custom Domain](#deploy-to-custom-domain)
5. [Auto-Deploy on Push](#auto-deploy-on-push)
6. [Manage Deployments](#manage-deployments)

---

## Import Repository

### Step 1: Create a New Project

```
1. Go to Dashboard
2. Click "New Project" or "Import Project"
3. Select "GitHub" as source
4. Select your repository
5. Choose default branch (usually 'main' or 'master')
```

### Step 2: Select Repository in Deployment Dialog

**Via Deployment Page:**

```
1. Go to Deployments page
2. Click "New Deployment"
3. Switch to "GitHub" tab
4. Click "Connect GitHub" button
   - Redirects to GitHub authorization
   - Authorize the app
   - Returns to app with access
5. See list of all repositories
   - Your own repositories
   - Organization repositories (if part of org)
   - Private repositories
6. Search/filter repositories
7. Select repository
8. Choose branch to deploy from
9. Click "Import Repository"
```

### Step 3: Repository Information Captured

After importing, the system captures:

```json
{
  "repository": {
    "id": 123456,
    "name": "my-project",
    "fullName": "username/my-project",
    "url": "https://github.com/username/my-project",
    "owner": "username",
    "description": "My awesome project",
    "isPrivate": false,
    "language": "JavaScript",
    "defaultBranch": "main",
    "branches": ["main", "develop", "staging"]
  },
  "selectedBranch": "main",
  "importedAt": "2025-11-04T..."
}
```

---

## Configure Build Settings

### Step 1: Select Build Type

**For Frontend (Next.js, React, Vue, etc):**

```
Build Command: npm run build
Start Command: npm start (not needed for static hosting)
Output Directory: .next or build/
Environment: Node.js 18+
```

**For Backend (Node.js, Python, etc):**

```
Build Command: npm install (or pip install)
Start Command: npm start (or python app.py)
Environment: Node.js 18+ (or Python 3.9+)
Runtime Port: 5000 (or your port)
```

**For Full Stack (Next.js with Backend):**

```
Build Command: npm install && npm run build
Start Command: npm start
Environment: Node.js 18+
Runtime: Full Stack
```

### Step 2: Configure in Deployer App

In your deployment settings:

```javascript
{
  "projectId": "proj_123",
  "name": "My Project",
  "buildSettings": {
    "buildCommand": "npm run build",
    "startCommand": "npm start",
    "outputDirectory": ".next",
    "nodeVersion": "18.x",
    "installCommand": "npm install"
  },
  "environment": "production"
}
```

### Step 3: Review Pre-deployment

Before deploying:

```
✓ Build command is correct
✓ Start command is correct
✓ Output directory exists
✓ Dependencies are listed in package.json
✓ All environment variables are set
✓ Domain is configured
```

---

## Set Environment Variables

### Step 1: Add Environment Variables in Project Settings

**Go to Project → Settings → Environment Variables**

### Step 2: Add Frontend Variables

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=My Project
NEXT_PUBLIC_VERSION=1.0.0
```

### Step 3: Add Backend Variables

```bash
PORT=5000
NODE_ENV=production
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_secret_key
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
```

### Step 4: Secure Sensitive Data

Never commit these to Git:
- Database credentials
- API keys
- Secrets
- Tokens

**Add to .gitignore:**

```bash
.env
.env.local
.env.*.local
```

**Set in Deployer Dashboard:**
- Go to Project Settings
- Environment Variables section
- Add each variable
- Mark as "Secret" if sensitive
- Variables are injected at build/runtime

---

## Deploy to Custom Domain

### Step 1: Register Domain

Register your domain on:
- GoDaddy
- Namecheap
- Google Domains
- Cloudflare

### Step 2: Configure Domain in Deployer

**Go to Project → Domains → Add Domain**

```
1. Enter domain name: myproject.com
2. Choose whether to use:
   - www.myproject.com
   - myproject.com
   - Both with redirect
3. Get nameservers or CNAME records
```

### Step 3: Update Domain Settings

**Option A: Update Nameservers (Full Control)**

In your domain registrar:

```
Change nameservers to:
ns1.deployer.com
ns2.deployer.com
ns3.deployer.com
ns4.deployer.com

(or whatever your deployer provides)
```

**Option B: Add CNAME Record (Simpler)**

In your domain registrar:

```
Record Type: CNAME
Name: www (or @)
Value: myproject-[id].deployer.com
TTL: 3600
```

### Step 4: Wait for DNS Propagation

```
DNS typically propagates within:
- Instant (optimistic)
- 15 minutes (usual)
- 24-48 hours (worst case)
```

### Step 5: Verify Domain

```
1. In Deployer dashboard → Domains
2. Click "Verify" button
3. Should show "✓ Domain verified"
4. Visit https://myproject.com
5. Your project loads!
```

---

## Auto-Deploy on Push

### Step 1: Enable GitHub Integration

Already done when you imported the repository!

### Step 2: Configure Webhook

**In Deployer:**

```
1. Go to Project → GitHub Setup
2. Click "Configure Webhook"
3. Webhook is automatically created on GitHub
4. Tests the webhook connection
5. Shows "✓ Webhook configured"
```

### Step 3: Test Auto-Deploy

```
1. Make a code change in your repo
2. Push to GitHub
   git add .
   git commit -m "test deployment"
   git push origin main

3. GitHub sends webhook to your deployer
4. Deployer triggers new build
5. Project rebuilds and redeploys
```

### Step 4: Monitor Deployment

**In Deployer Dashboard:**

```
1. Go to Deployments page
2. See new deployment with status:
   - Building (in progress)
   - Success (deployed)
   - Failed (check logs)
3. Click on deployment to view logs
4. See build output and any errors
```

---

## Manage Deployments

### View All Deployments

```
Dashboard → Deployments

Shows:
- Date deployed
- Branch deployed
- Commit hash
- Deployment status
- Build time
- Size
```

### View Deployment Details

```
Click on any deployment to see:
- Build logs (real-time output)
- Environment variables used
- Build time
- Asset sizes
- Errors (if any)
```

### Rollback to Previous Deployment

```
1. Go to Deployments
2. Find previous successful deployment
3. Click "Rollback"
4. Confirm
5. Project reverts to that version
6. Visible immediately
```

### Redeploy Current Commit

```
1. Go to Deployments
2. Find deployment
3. Click "Redeploy"
4. Same code, fresh build
5. Useful if build was cached incorrectly
```

### Preview Deployment URLs

Each deployment gets:

```
- Main domain: https://myproject.com
- Preview URL: https://deploy-abc123.deployer.com
- Staging: https://myproject-staging.deployer.com (if configured)
```

---

## Complete Workflow Example

### Example: Deploy a Next.js Project

**Step 1: Repository Structure**

```
my-nextjs-app/
├── app/
├── components/
├── public/
├── package.json
├── .env.example
├── next.config.js
└── README.md
```

**Step 2: Package.json Setup**

```json
{
  "name": "my-nextjs-app",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0"
  }
}
```

**Step 3: Import Repository**

```
1. Dashboard → New Project
2. Select "GitHub"
3. Select "my-nextjs-app" repository
4. Select branch: main
5. Click Import
```

**Step 4: Configure Deployment**

```
Build Command: npm run build
Start Command: npm start
Output Directory: .next
Node Version: 18.x
```

**Step 5: Set Environment Variables**

```
NEXT_PUBLIC_API_URL=https://api.myproject.com
DATABASE_URL=mongodb+srv://...
JWT_SECRET=xxx
```

**Step 6: Add Domain**

```
Domain: myproject.com
Type: www redirect
```

**Step 7: Deploy**

```
1. Click "Deploy Now"
2. Watch build logs
3. Deployment completes
4. Visit https://myproject.com ✓
```

**Step 8: Enable Auto-Deploy**

```
1. Push code to GitHub
2. Webhook triggers
3. New build starts
4. Deploy succeeds
5. Changes live immediately
```

---

## Advanced Features

### Environment-Specific Deployments

**Staging Environment:**

```
Branch: develop
Domain: staging.myproject.com
Environment Variables: STAGING_MODE=true
```

**Production Environment:**

```
Branch: main
Domain: myproject.com
Environment Variables: NODE_ENV=production
```

### Build Optimization

**Enable Caching:**

```
Faster rebuilds by caching:
- node_modules/
- .next/cache/
- build artifacts
```

**Enable Compression:**

```
Gzip/Brotli compression for:
- JavaScript files
- CSS files
- Images
```

### Analytics & Monitoring

**Track Deployments:**

```
- Deployment frequency
- Success rate
- Average build time
- Performance metrics
```

**Monitor Application:**

```
- Uptime monitoring
- Error tracking
- Performance metrics
- Traffic analytics
```

---

## Deployment Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 🔵 Building | Build in progress | Wait for completion |
| 🟢 Success | Deployed successfully | Live on domain |
| 🔴 Failed | Build failed | Check logs, fix error |
| 🟡 Queued | Waiting to build | Will start soon |
| ⚪ Cancelled | Build was cancelled | Can redeploy |

---

## Troubleshooting Deployments

### Build Fails

**Check:**
1. Build logs for error messages
2. package.json has all dependencies
3. Environment variables are set
4. Node version compatibility

**Fix:**
```bash
# Reproduce locally
npm install
npm run build

# Fix the error
# Commit and push
git push origin main
```

### Domain Not Working

**Check:**
1. DNS records are set correctly
2. Domain is verified in dashboard
3. SSL certificate is issued
4. CNAME points to correct deployer URL

**Fix:**
```bash
# Check DNS propagation
nslookup myproject.com

# or visit
https://www.dnschecker.org/
```

### Performance Issues

**Check:**
1. Build time increasing
2. Cache settings
3. Dependencies bloat
4. Image optimization

**Optimize:**
```bash
# Analyze bundle size
npm install -D webpack-bundle-analyzer

# Optimize images
# Use Next.js Image component
```

### Environment Variables Not Applied

**Check:**
1. Variable name is correct
2. Not using wrong prefix (NEXT_PUBLIC_ vs private)
3. Redeployed after adding variable
4. Variable shows in deployment logs

**Fix:**
```
1. Delete variable
2. Re-add variable
3. Redeploy
```

---

## Best Practices

### 1. Version Control

```bash
# Always use meaningful commit messages
git commit -m "feat: add user authentication"

# Use semantic versioning
git tag v1.0.0
git push --tags
```

### 2. Environment Separation

```
main branch → Production domain
develop branch → Staging domain
feature/* branches → Preview URLs
```

### 3. Testing Before Deploy

```bash
# Test locally
npm run build
npm start

# Run tests
npm test

# Only push if passing
git push origin main
```

### 4. Monitoring Deployments

```
- Check build logs for warnings
- Monitor error tracking
- Set up alerts for failures
- Review analytics regularly
```

### 5. Security

```
- Never commit .env files
- Use strong secrets
- Rotate secrets regularly
- Enable two-factor auth on GitHub
- Review deployment logs regularly
```

---

## Comparison: Deployer vs Netlify vs Render

| Feature | Deployer | Netlify | Render |
|---------|----------|---------|--------|
| GitHub Import | ✅ | ✅ | ✅ |
| Auto-Deploy | ✅ | ✅ | ✅ |
| Custom Domain | ✅ | ✅ | ✅ |
| Environment Vars | ✅ | ✅ | ✅ |
| Build Cache | ✅ | ✅ | ✅ |
| Webhooks | ✅ | ✅ | ✅ |
| Preview URLs | ✅ | ✅ | ✅ |
| Rollback | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ Limited | ✅ |
| Cost | Free/Paid | Free/Paid | Free/Paid |

---

## Next Steps

1. **Import Your Repository**
   - Go to Dashboard
   - Click "Import Project"
   - Select GitHub repository

2. **Configure Build Settings**
   - Set build command
   - Set start command
   - Add environment variables

3. **Add Custom Domain**
   - Register domain
   - Add to project
   - Update DNS records
   - Verify domain

4. **Enable Auto-Deploy**
   - Configure webhook
   - Test with code push
   - Monitor deployments

5. **Optimize & Monitor**
   - Enable caching
   - Set up monitoring
   - Review analytics
   - Improve performance

---

## Support & Resources

- **Documentation**: See GITHUB_INTEGRATION_FIX.md
- **Troubleshooting**: See GITHUB_INTEGRATION_DEPLOYMENT_TEST.md
- **Quick Diagnostics**: See GITHUB_QUICK_DIAGNOSTICS.md
- **API Reference**: See API_ROUTES.md

