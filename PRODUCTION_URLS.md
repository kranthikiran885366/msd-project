# Production URLs Configuration

## Live Deployments

### Frontend (Vercel)
- **URL**: https://kranthi-project-deployer.vercel.app
- **Repo**: https://github.com/kranthikiran885366/msd-project
- **Branch**: main
- **Environment**: Production

### Backend (Render)
- **URL**: https://msd-project-8c1o.onrender.com
- **Health Check**: https://msd-project-8c1o.onrender.com/health
- **API Base**: https://msd-project-8c1o.onrender.com/api
- **Environment**: Production

---

## Important URLs

### Authentication Endpoints
- **GitHub OAuth Login**: https://msd-project-8c1o.onrender.com/auth/github
- **GitHub Callback**: https://msd-project-8c1o.onrender.com/auth/github/callback
- **Google OAuth Login**: https://msd-project-8c1o.onrender.com/auth/google
- **Google Callback**: https://msd-project-8c1o.onrender.com/auth/google/callback

### Frontend Pages
- **Home**: https://kranthi-project-deployer.vercel.app/
- **Dashboard**: https://kranthi-project-deployer.vercel.app/dashboard
- **Login**: https://kranthi-project-deployer.vercel.app/login
- **Sign Up**: https://kranthi-project-deployer.vercel.app/signup

### Status & Help
- **Status Page**: https://kranthi-project-deployer.vercel.app/status
- **Help Center**: https://kranthi-project-deployer.vercel.app/help

---

## GitHub Configuration

### Repository Settings
- **Owner**: kranthikiran885366
- **Repo**: msd-project
- **Main Branch**: main
- **Public/Private**: Public

### GitHub OAuth App Settings
**Location**: https://github.com/settings/developers → OAuth Apps → Your App

**Required Settings**:
- Authorization callback URLs (add both):
  ```
  http://localhost:5000/auth/github/callback
  https://msd-project-8c1o.onrender.com/auth/github/callback
  ```

### Environment Variables in GitHub
**Secret Names** (if using GitHub Actions):
```
NEXT_PUBLIC_API_URL → https://msd-project-8c1o.onrender.com
```

---

## Environment Configuration

### Frontend Environment Variables (`.env.production`)
```env
NEXT_PUBLIC_API_URL=https://msd-project-8c1o.onrender.com
NEXT_PUBLIC_CLIENT_URL=https://kranthi-project-deployer.vercel.app
API_URL=https://msd-project-8c1o.onrender.com
CLIENT_URL=https://kranthi-project-deployer.vercel.app
```

### Backend Environment Variables (`server/.env.production`)
```env
API_URL=https://msd-project-8c1o.onrender.com
CLIENT_URL=https://kranthi-project-deployer.vercel.app
NODE_ENV=production
```

---

## Deployment Platforms

### Vercel (Frontend)
- **Dashboard**: https://vercel.com
- **Project**: kranthi-project-deployer
- **Custom Domain**: (configured in Vercel)
- **CI/CD**: Automatic on push to main

### Render (Backend)
- **Dashboard**: https://dashboard.render.com
- **Service**: msd-project-8c1o
- **Type**: Web Service
- **Region**: Oregon (or current)
- **Environment**: Production

---

## Key API Routes

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with email
- `GET /api/auth/github` - GitHub OAuth initiate
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/google` - Google OAuth initiate
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details

### Deployments
- `GET /api/deployments` - List deployments
- `POST /api/deployments` - Create deployment
- `GET /api/deployments/:id` - Get deployment details

---

## Testing Production URLs

### Health Check
```bash
curl https://msd-project-8c1o.onrender.com/health
```

### Frontend Health Check
```bash
curl https://kranthi-project-deployer.vercel.app/
```

### API Test
```bash
curl https://msd-project-8c1o.onrender.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Documentation Links

- **OAuth Configuration**: See `OAUTH_REDIRECT_URL_CONFIGURATION.md`
- **Backend API**: See `API_ROUTES.md`
- **Authentication**: See `AUTHENTICATION_COMPLETE.md`
- **Deployment**: See `DEPLOYMENT_PAGES_UPDATE.md`

---

## Last Updated
- Commit: `41e9ac6` - "fix: update GitHub link on homepage to point to repository"
- Date: November 3, 2025

---

## Notes
✅ All production URLs are live and configured
✅ OAuth redirect URLs configured in both GitHub and Google
✅ Frontend automatically redirects GitHub link to repository
✅ Environment variables properly set in both Vercel and Render
✅ Backend API accessible from frontend via `NEXT_PUBLIC_API_URL`
