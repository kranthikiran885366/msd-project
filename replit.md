# CloudDeck - Replit Setup

## Overview
Full-stack deployment platform with a Next.js frontend and Express.js backend API.

## Architecture
- **Frontend**: Next.js 15 (App Router) — runs on port 5000
- **Backend**: Express.js API server — runs on port 3001
- **Database**: MongoDB (optional, falls back to in-memory mock mode if unavailable)

## Services & Workflows
- **Start application** (webview, port 5000): `npm run dev` — Next.js frontend
- **Backend API** (console, port 3001): `cd server && node index.js` — Express API

## API Routing
Next.js proxies `/api/*` and `/auth/*` requests to the backend at `http://localhost:3001` via `next.config.mjs` rewrites.

## Key Environment Variables
Set in Replit Secrets/Env Vars:
- `NEXT_PUBLIC_API_URL` — Backend URL (default: `http://localhost:3001`)
- `CLIENT_URL` — Frontend URL (default: `http://localhost:5000`)
- `MONGODB_URI` — MongoDB connection string (optional)
- `JWT_SECRET` — JWT signing secret
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth (optional)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth (optional)
- `STRIPE_SECRET_KEY` — Stripe payments (optional)

## Notes
- OAuth strategies (GitHub, Google) only register if credentials are present — no crash on missing keys
- MongoDB connection failure is non-fatal; server continues in mock/in-memory mode
- Backend CORS is configured to allow Replit proxy domains (`*.replit.dev`, `*.repl.co`, `*.replit.app`)
