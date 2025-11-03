# GitHub Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Deployment Page                                        │   │
│  │  ├─ New Deployment Button                               │   │
│  │  └─ deployment-table.jsx                                │   │
│  └──────────────────┬──────────────────────────────────────┘   │
│                     │                                            │
│  ┌──────────────────┴──────────────────────────────────────┐   │
│  │  NewDeploymentDialog                                   │   │
│  │  ├─ Manual Tab (traditional)                           │   │
│  │  ├─ GitHub Tab (NEW)                                   │   │
│  │  │  ├─ Project Selector                                │   │
│  │  │  ├─ GitHub Repo Browser Button                      │   │
│  │  │  ├─ Environment Selector                            │   │
│  │  │  └─ Deploy Button                                   │   │
│  │  └─ Dialog State Management                            │   │
│  └──────────────────┬──────────────────────────────────────┘   │
│                     │                                            │
│  ┌──────────────────┴──────────────────────────────────────┐   │
│  │  GitHubImportDialog (NEW)                              │   │
│  │  ├─ GitHub Connection Status                           │   │
│  │  ├─ Repository Search/Filter                           │   │
│  │  ├─ Repository List                                    │   │
│  │  │  ├─ Repo Name & Full Path                           │   │
│  │  │  ├─ Description                                     │   │
│  │  │  ├─ Language & Stars                                │   │
│  │  │  └─ Private Badge                                   │   │
│  │  ├─ Branch Selection                                   │   │
│  │  └─ Import Button                                      │   │
│  └──────────────────┬──────────────────────────────────────┘   │
│                     │                                            │
│  ┌──────────────────┴──────────────────────────────────────┐   │
│  │  API Client (lib/api-client.js) (ENHANCED)             │   │
│  │  ├─ getGitHubRepositories()                            │   │
│  │  ├─ getGitHubRepositoryBranches(owner, repo)           │   │
│  │  ├─ getGitHubRepositoryDetails(owner, repo)            │   │
│  │  ├─ getGitHubConnectionStatus()                        │   │
│  │  ├─ connectGitHub(token)                               │   │
│  │  ├─ disconnectGitHub()                                 │   │
│  │  └─ createGitHubDeploymentWebhook(owner, repo)         │   │
│  └──────────────────┬──────────────────────────────────────┘   │
└─────────────────────┼─────────────────────────────────────────┘
                      │
                      │ HTTP/REST
                      │
┌─────────────────────┼─────────────────────────────────────────┐
│                     ▼                                           │
│             Backend (Node.js/Express)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Auth Middleware                                         │  │
│  │  ├─ Validate JWT Token                                  │  │
│  │  ├─ User Identification                                 │  │
│  │  └─ Permission Checking                                 │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│  ┌──────────────────┴───────────────────────────────────────┐  │
│  │  GitHub Provider Routes (NEW)                           │  │
│  │  /api/github-provider/                                  │  │
│  │  ├─ GET  /repositories                                  │  │
│  │  ├─ GET  /repositories/:owner/:repo                     │  │
│  │  ├─ GET  /repositories/:owner/:repo/branches            │  │
│  │  ├─ GET  /repositories/:owner/:repo/file/:path          │  │
│  │  ├─ POST /connect                                       │  │
│  │  ├─ POST /disconnect                                    │  │
│  │  ├─ GET  /status                                        │  │
│  │  ├─ GET  /repositories/:owner/:repo/webhooks            │  │
│  │  └─ POST /repositories/:owner/:repo/webhooks/deployment │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│  ┌──────────────────┴───────────────────────────────────────┐  │
│  │  GitHub Provider Controller (NEW)                       │  │
│  │  (server/controllers/githubProviderController.js)       │  │
│  │  ├─ getRepositories()                                   │  │
│  │  ├─ getRepositoryDetails()                              │  │
│  │  ├─ getRepositoryBranches()                             │  │
│  │  ├─ getRepositoryFile()                                 │  │
│  │  ├─ connectGitHub()                                     │  │
│  │  ├─ disconnectGitHub()                                  │  │
│  │  ├─ getConnectionStatus()                               │  │
│  │  ├─ getWebhooks()                                       │  │
│  │  └─ createDeploymentWebhook()                           │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│  ┌──────────────────┴───────────────────────────────────────┐  │
│  │  MongoDB Database                                       │  │
│  │  ├─ Users Collection                                    │  │
│  │  ├─ GitHubIntegration Collection (NEW)                  │  │
│  │  │  ├─ userId (FK)                                      │  │
│  │  │  ├─ githubUsername                                   │  │
│  │  │  ├─ accessToken (encrypted)                          │  │
│  │  │  ├─ refreshToken                                     │  │
│  │  │  ├─ expiresAt                                        │  │
│  │  │  └─ connectedAt                                      │  │
│  │  └─ Deployments Collection                              │  │
│  │     └─ repository metadata (new fields)                 │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└─────────────────────┼─────────────────────────────────────────┘
                      │
                      │ HTTPS
                      │
┌─────────────────────┼─────────────────────────────────────────┐
│                     ▼                                           │
│             GitHub API (https://api.github.com)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /user/repos              - List user repositories        │  │
│  │  /repos/:owner/:repo      - Get repo details             │  │
│  │  /repos/:owner/:repo/branches - List branches            │  │
│  │  /repos/:owner/:repo/contents/:path - Read files         │  │
│  │  /repos/:owner/:repo/hooks - Manage webhooks             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. GitHub Connection Flow
```
User → Clicks "Connect GitHub" → OAuth Redirect → GitHub Auth Page
                                                         ↓
GitHub → Returns Auth Code → /auth/github/callback → Backend
                                                         ↓
Backend → Exchange Code for Token → Store in DB → Frontend
                                                         ↓
Frontend → Show Connected Status & Repos ← Backend fetches list
```

### 2. Repository Selection Flow
```
User → "Select GitHub Repository" → Shows Dialog
                                         ↓
Dialog → Fetches repos from API ← Backend queries GitHub
                                         ↓
User → Searches/filters repos → Real-time filter
                                         ↓
User → Selects repo → Fetches branches ← Backend queries GitHub
                                         ↓
User → Selects branch → Returns selected data
                                         ↓
Dialog → Returns repo + branch to parent component
```

### 3. Deployment Creation Flow
```
User → Selects project + environment → Clicks Deploy
                                         ↓
Dialog → Submit form with GitHub data + API call
                                         ↓
Backend → Create Deployment record
          ├─ Store repo metadata
          ├─ Store branch info
          ├─ Link to project
          └─ Trigger build process
                                         ↓
Frontend → Show success & close dialog
                                         ↓
Dashboard → Refresh & show new deployment
```

## Component Interaction

```
┌─────────────────────────────────────────────┐
│      DeploymentsPage                        │
│  (app/(app)/deployments/page.jsx)           │
└────────┬────────────────────────────────────┘
         │
         ├─ "New Deployment" button click
         │
         ▼
┌─────────────────────────────────────────────┐
│  NewDeploymentDialog                        │
│  (components/new-deployment-dialog.jsx)     │
│                                             │
│  ┌─ Manual Tab │ GitHub Tab ─┐             │
│  │                           │             │
│  │ (Traditional)  (NEW)      │             │
│  │                    ▼      │             │
│  │                 "Select Repo" button   │
│  │                    │      │             │
│  │                    ▼      │             │
│  │  ┌─────────────────────────────┐       │
│  │  │ GitHubImportDialog          │       │
│  │  │ (components/                │       │
│  │  │  github-import-dialog.jsx)  │       │
│  │  │                             │       │
│  │  │ ├─ Repo List                │       │
│  │  │ ├─ Search                   │       │
│  │  │ ├─ Branch Selection         │       │
│  │  │ └─ Import Button            │       │
│  │  └─────────────────────────────┘       │
│  │                                         │
│  └─────────────────────────────────────────┘
│
└─────────────────────────────────────────────┘
```

## State Management

### NewDeploymentDialog State
```javascript
{
  projectId: string,           // Selected project
  environment: string,         // staging | production | development
  branch: string,              // For manual mode
  repository: {                // For GitHub mode
    repository: {
      id: number,
      name: string,
      fullName: string,        // owner/repo
      owner: string,
      url: string,
      description: string,
      language: string,
      stars: number,
      defaultBranch: string,
      isPrivate: boolean
    },
    branch: {
      name: string,
      commit: string,
      protected: boolean
    }
  },
  deploymentSource: 'manual' | 'github'
}
```

### GitHubImportDialog State
```javascript
{
  repos: Array,                // All user repos
  filteredRepos: Array,        // Search results
  selectedRepo: Object,        // Selected repo
  branches: Array,             // Branches of selected repo
  selectedBranch: Object,      // Selected branch
  searchQuery: string,         // Search input
  loading: boolean,            // Fetch state
  loadingBranches: boolean,    // Branch fetch state
  connectionStatus: {
    connected: boolean,
    username: string,
    avatar: string
  }
}
```

## API Sequence Diagram

```
Frontend          Backend           GitHub API
   │                 │                  │
   ├─ getRepos ─────>│                  │
   │                 ├─ GET /user/repos >
   │                 <────── repos ─────│
   │<─── repos array ─│                  │
   │                 │                  │
   ├─ selectRepo ──>│                  │
   │                 ├─ GET /repos/owner/repo/branches >
   │                 <────── branches ──│
   │<─ branches array ─│                  │
   │                 │                  │
   ├─ importRepo ──>│                  │
   │                 ├─ POST /deployments
   │                 │   (store repo data)
   │<─ success ─────│                  │
   │                 │                  │
```

## Security Flow

```
User Authentication
     │
     ├─ GitHub OAuth Flow
     │  ├─ Request auth code
     │  ├─ Exchange for access token
     │  └─ Store encrypted in DB
     │
     ├─ API Requests
     │  ├─ JWT Token in Authorization header
     │  ├─ Verify user identity
     │  └─ Use GitHub token for API calls
     │
     └─ Webhook Verification
        ├─ Receive GitHub webhook
        ├─ Verify GITHUB_WEBHOOK_SECRET
        └─ Process deployment
```

## File Organization

```
project-root/
├── app/
│   └── (app)/
│       └── deployments/
│           └── page.jsx (uses new components)
│
├── components/
│   ├── new-deployment-dialog.jsx (ENHANCED)
│   └── github-import-dialog.jsx (NEW)
│
├── lib/
│   └── api-client.js (ENHANCED with GitHub methods)
│
├── server/
│   ├── routes/
│   │   ├── auth.js (existing GitHub OAuth)
│   │   └── github-provider.js (NEW)
│   │
│   ├── controllers/
│   │   └── githubProviderController.js (NEW)
│   │
│   └── models/
│       └── GitHubIntegration.js (NEW)
│
└── Documentation/
    ├── GITHUB_INTEGRATION_GUIDE.md (NEW)
    └── GITHUB_INTEGRATION_SUMMARY.md (NEW)
```

## Key Technologies Used

- **Frontend**: React/Next.js, TypeScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: OAuth 2.0 (GitHub)
- **API**: REST/HTTP
- **External APIs**: GitHub API v3
- **UI Components**: Shadcn/ui (Dialog, Button, Input, Card)
- **Icons**: Lucide React

This architecture provides a Netlify-like GitHub integration experience!
