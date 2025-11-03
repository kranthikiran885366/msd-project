# OAuth Redirect URL Configuration

## Summary
GitHub and Google OAuth redirect URLs have been updated to use full URLs from environment variables instead of relative paths. This enables proper OAuth flow across multiple deployments (local development, staging, production).

## What Changed

### 1. **Backend OAuth Configuration** (`server/config/passport.js`)

**Before:**
```javascript
callbackURL: "/auth/github/callback"  // Relative path
callbackURL: "/auth/google/callback"  // Relative path
```

**After:**
```javascript
callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/auth/github/callback`
callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/auth/google/callback`
```

### 2. **Environment Variables**

#### Frontend (Vercel)
**`.env.production`** (Frontend):
```env
NEXT_PUBLIC_API_URL=https://msd-project-8c1o.onrender.com
NEXT_PUBLIC_CLIENT_URL=https://kranthi-project-deployer.vercel.app
```

**`.env.local`** (Local Development):
```env
NEXT_PUBLIC_API_URL=https://msd-project-8c1o.onrender.com
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
```

#### Backend (Render)
**`server/.env.production`** (Production):
```env
API_URL=https://msd-project-8c1o.onrender.com
CLIENT_URL=https://kranthi-project-deployer.vercel.app
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
```

**`server/.env`** (Local Development):
```env
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=734157965900-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GITHUB_CLIENT_ID=Ov23likurvc...
GITHUB_CLIENT_SECRET=820f78a1...
```

## OAuth Redirect URLs

### GitHub OAuth
- **Local Development**: `http://localhost:5000/auth/github/callback`
- **Production (Render)**: `https://msd-project-8c1o.onrender.com/auth/github/callback`

### Google OAuth
- **Local Development**: `http://localhost:5000/auth/google/callback`
- **Production (Render)**: `https://msd-project-8c1o.onrender.com/auth/google/callback`

## Required GitHub Configuration Updates

Go to: `https://github.com/settings/developers` → OAuth Apps → Your App

**Authorization callback URLs** (add both for local + production):
```
http://localhost:5000/auth/github/callback
https://msd-project-8c1o.onrender.com/auth/github/callback
```

## Required Google Configuration Updates

Go to: `Google Cloud Console` → APIs & Services → Credentials → OAuth 2.0 Client ID

**Authorized redirect URIs** (add both for local + production):
```
http://localhost:5000/auth/google/callback
https://msd-project-8c1o.onrender.com/auth/google/callback
```

## Render Environment Variables Required

In Render dashboard for `msd-project-8c1o` service, add:
```
API_URL=https://msd-project-8c1o.onrender.com
CLIENT_URL=https://kranthi-project-deployer.vercel.app
GOOGLE_CLIENT_ID=<your-value>
GOOGLE_CLIENT_SECRET=<your-value>
GITHUB_CLIENT_ID=Ov23likurvcQURsPd8YX
GITHUB_CLIENT_SECRET=820f78a1957b558383d18315c18525ab003ea167
```

## Frontend-Backend Communication Flow

1. **User clicks "Sign in with GitHub/Google"**
2. Frontend redirects to: `https://msd-project-8c1o.onrender.com/auth/github`
3. OAuth provider redirects to: `https://msd-project-8c1o.onrender.com/auth/github/callback`
4. Backend verifies auth, generates JWT tokens
5. Backend redirects to: `https://kranthi-project-deployer.vercel.app/auth/callback?token=...`
6. Frontend stores tokens and logs in user

## Commits
- `26d273a`: "fix: update OAuth redirect URLs to use full URLs from environment variables"
- `9ef1f5e`: "add: production environment configuration with backend URL"

## Status
✅ **Configuration Complete** - Ready for production deployment

Next Steps:
1. Update GitHub OAuth App callback URLs
2. Update Google Cloud OAuth 2.0 redirect URIs
3. Set environment variables in Render dashboard
4. Test OAuth flow in production
