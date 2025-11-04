# Environment Variables Setup

## Required Environment Variables

To get the full application working, you need to set up these environment variables on Render (backend) and Vercel (frontend).

### GitHub OAuth

1. **Create a GitHub OAuth App:**
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Fill in:
     - **Application name**: CloudDeck Deployer
     - **Homepage URL**: `https://kranthi-project-deployer.vercel.app`
     - **Authorization callback URL**: `https://msd-project-8c1o.onrender.com/auth/github/callback`
   - Click "Register application"
   - Copy the **Client ID** and **Client Secret**

2. **Add to Render Backend:**
   ```bash
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### Google OAuth

1. **Create a Google OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth Client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `https://msd-project-8c1o.onrender.com/auth/google/callback`
   - Copy the **Client ID** and **Client Secret**

2. **Add to Render Backend:**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### Complete Backend Environment Variables (.env.production)

```bash
# API Configuration
PORT=5000
NODE_ENV=production
API_URL=https://msd-project-8c1o.onrender.com
CLIENT_URL=https://kranthi-project-deployer.vercel.app

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db

# JWT
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Stripe (Optional)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_publishable_key

# Email Configuration
EMAIL_SERVICE=gmail
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_app_password

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://msd-project-8c1o.onrender.com
NEXT_PUBLIC_CLIENT_URL=https://kranthi-project-deployer.vercel.app
```

### Complete Frontend Environment Variables (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://msd-project-8c1o.onrender.com
NEXT_PUBLIC_CLIENT_URL=https://kranthi-project-deployer.vercel.app
```

## How to Set Environment Variables

### On Render:

1. Go to your backend service → Settings
2. Scroll to "Environment"
3. Click "Add Environment Variable"
4. Add all the variables from the "Complete Backend" section above
5. Click "Save Changes"

### On Vercel:

1. Go to your project → Settings → Environment Variables
2. Add the frontend variables:
   - `NEXT_PUBLIC_API_URL` = `https://msd-project-8c1o.onrender.com`
   - `NEXT_PUBLIC_CLIENT_URL` = `https://kranthi-project-deployer.vercel.app`
3. Save and redeploy

## Verification

After setting environment variables:

1. **GitHub OAuth Test:**
   - Go to your app login page
   - Click "GitHub" button
   - You should be redirected to GitHub login
   - After authorizing, you should be logged in

2. **Google OAuth Test:**
   - Click "Google" button
   - You should be redirected to Google login
   - After authorizing, you should be logged in

## Troubleshooting

### "Invalid Client ID" Error

- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
- Check that OAuth app is authorized for your domain
- Ensure callback URLs match exactly (including https://)

### "Redirect URI doesn't match"

- In GitHub OAuth app settings, add exact redirect URI:
  `https://msd-project-8c1o.onrender.com/auth/github/callback`
- In Google OAuth app settings, ensure the URI is whitelisted

### Environment Variables Not Working

1. In Render: After adding env vars, you must **redeploy** the service
2. In Vercel: After adding env vars, you must **redeploy** the project
3. Wait for deployment to complete before testing

### Still Not Working?

1. Check backend logs in Render:
   ```bash
   # Check what environment variables are loaded
   console.log(process.env.GITHUB_CLIENT_ID) // Should NOT be empty
   ```

2. Check frontend logs in browser console (F12)

3. Verify the OAuth apps are active and not revoked

4. Make sure you're using the production URLs, not localhost

## Security Notes

⚠️ **DO NOT** commit `.env.production` to GitHub!

✅ Set environment variables through:
- Render Dashboard (for backend)
- Vercel Dashboard (for frontend)
- CI/CD secrets if using GitHub Actions

This keeps your secrets safe and out of version control.
