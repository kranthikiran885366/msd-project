# CloudDeck product and security audit

25 November 2026. Scope: source review and bounded verification of MSD and this branch. This is not an exhaustive audit, independent penetration test or production certification.

## Decision

Reuse the application/control-plane foundation. Replace shared-host execution before accepting untrusted tenants. Do not provision a public fleet from development Compose or infer completeness from the number of routes.

| Component | Reuse and implemented corrections | Remaining limitations |
| --- | --- | --- |
| Next.js | Fixed React/vaul dependency conflict; restored strict build checks; redesigned core API-backed workspace | Legacy advanced screens are outside acceptance; no browser visual review completed |
| Express/Mongoose | Database startup fails closed; core project/config/deployment ownership guards | Other resource families need a complete authorization sweep |
| Identity | Typed/revocable JWT sessions, password bounds, verified-email gate, hashed email tokens, session-bound OAuth exchange | Live provider/browser/SMTP tests; browser tokens still use local storage; secure-cookie migration planned |
| Deployment state | Await durable queue insertion; reject invalid/late transitions; remove other-user token fallback and provider-error success | Durable outbox, leases, crash reconciliation and immutable rollback |
| BullMQ | One dispatch mechanism; atomic claims; per-job executor state | Exactly-once external effects are not established |
| Job executor | Removed fabricated successful index, swallowed errors and random port fallback; added root-path checks, redaction and HTTP readiness | Shared Docker/worker credentials/runtime on one host are not tenant isolation. Production execution is now blocked in code |
| Gateway | Separate application origin and real HTTP/WebSocket forwarding | Scoped routing identities, reconciled directory, custom domains and certificates |
| Environments | Encrypted core values and private temporary runtime env files | KMS envelope encryption, scoped build grants and explicit build/runtime secret separation |
| Docker/Compose | Node 22/npm images, non-root control plane, loopback ports/readiness | Development only; socket mount remains trusted-operator infrastructure |

## Critical release gates

| Gate | Source evidence | Required work |
| --- | --- | --- |
| Build/runtime isolation | `runner-agent/jobExecutor.js`, `docker-compose.yml` | Disposable build VM per job; separate isolated runtime account; no shared host socket or platform credentials in customer code; hostile workload tests |
| Organizations/RBAC | Core guards use individual project owner | Membership/role model and tenant authorization on every resource, socket room and background job; migrate owner projects safely |
| Billing | `server/services/billingService.js`, `server/routes/billing.js` | Legacy local subscription becomes active without confirmed payment; user-facing usage is not a trusted meter. Replace with signed provider events and an idempotent ledger before charging anyone |
| Custom domains/TLS | `server/services/domainService.js` | DNS record handling does not install ingress/certificates; implement ownership uniqueness, actual HTTPS, renewal/removal and takeover prevention |
| GitHub automation | OAuth/repository and webhook code | GitHub App installation mapping, short-lived tokens, raw-body signature verification, replay deduplication and no-secret fork previews proven live |
| Previews | Deployment environment records | PR lifecycle, trusted commit resolution, isolated configuration, protected previews and cleanup remain unaccepted |
| Rollback | Full commit SHA checkout supported | Rebuild-by-SHA is not retained-artifact rollback; implement digest retention and atomic route promotion |
| Scaling | Node/port registries and concurrency | Resource reservations, placement, health reconciliation, autoscaling, disruption and spend limits |
| Operations/DR | Readiness/logs/metrics | SLO alerting, secret-safe telemetry, PITR, actual restore and incident exercises |

## Configuration and legacy risk

Operational `.env.docker` and `.env.production` were tracked. This branch removes them and generates private settings. Deleting files neither revokes credentials nor erases history. The owner must identify and rotate any real values previously committed. Encryption-key rotation requires re-encrypting stored values before retiring a key.

The old `docker-compose.production.yml` referenced nonexistent service directories and a different database architecture. It is removed rather than presented as working provisioning. Historical deployment scripts/documents are not an approved production runbook; the current [hosting plan](HOSTING_PLAN.md) governs this release decision.

Some legacy advanced routes/store methods still contain local state or unaccepted behavior. They do not establish live SSO, organizations, functions, databases, billing or domain provisioning. Focused navigation does not secure every directly addressable legacy route. Public access remains blocked pending route-by-route capability and authorization review.

Unit tests use controlled dependencies where appropriate; gateway transport tests use real sockets with controlled lookup. Real MongoDB tests cannot initialize in this execution environment. Cloud builds, tenant isolation, payments, DNS/TLS, email and recovery have not passed here. See [VERIFICATION.md](VERIFICATION.md).
