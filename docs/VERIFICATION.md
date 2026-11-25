# Verification record

25 November 2026. Repository base: `63df076873b7c86bf179dfcfb1758caf1aea488d`. Results are from the local review workspace, not a deployed production fleet. Runtime: Node.js 24.22.3 / npm 11.19.1; CI is configured for Node.js 22 and must run independently.

| Check | Observed result | Limits |
| --- | --- | --- |
| Clean `npm ci` in root/server/runner | Passed | Fresh installs reproduced from the three npm lockfiles |
| Root ESLint | Passed | Configured structural/Next rules; not an exhaustive security analyzer |
| TypeScript `tsc --noEmit` | Passed | JS-heavy backend still requires runtime/integration checks |
| `npm test` | **54 passed, 0 failed, 0 skipped** | Unit/transport tests, not cloud E2E |
| Strict `next build` | Passed | Type/build checks enabled; not browser acceptance |
| Frontend HTTP smoke | **5 routes passed**, including CSS retrieval | `/`, `/docs`, `/login`, `/signup`, `/verify-email`; server-rendered responses only |
| Real MongoDB Jest suite | **Blocked; command failed** | Three suites/12 tests fail in setup because actual mongod exits code 100. Probe reports `open: Operation not permitted`; assertions did not establish passing behavior |
| Browser/visual review | Not run successfully | Local preview was unavailable to the browser; no layout/interaction claims |
| Docker image build and real worker deployment | Not run | No Docker-capable staging machine available |
| OAuth/SMTP/payment/DNS/TLS providers | Not accepted | Credentials, owned domains and real staging exercise required |
| Dependency vulnerability audit | Unavailable | Registry audit endpoint returned an error; no clean audit claimed |
| Infrastructure/tenant isolation/restore/load tests | Not run | Infrastructure and isolated execution adapters are still to be implemented |

Root tests cover production secret validation; ownership denial with controlled model dependencies; terminal state transitions; stale callback behavior; safe return URLs; access/refresh JWT separation; password bounds; OAuth exchange/session behavior with controlled persistence; API mutation retry behavior; local secret generation/refusal to overwrite; root traversal/symlink checks; real HTTP and WebSocket gateway transport using a controlled route lookup; reserved ports; private runtime env files; cancellation; and the production prohibition on shared-Docker execution.

The real-database suite must be rerun where MongoDB can start. Do not replace it with a fake database and label it E2E. A successful download of the MongoDB binary does not establish that the server can run.

## Reproduce

```sh
npm ci
npm ci --prefix server
npm ci --prefix runner-agent
npm run verify
node scripts/smoke-frontend.cjs
MONGOMS_VERSION=7.0.24 npm test --prefix server -- --runInBand
```

The GitHub workflow is configured for clean installs, verification, HTTP checks and actual MongoDB tests. Its [first PR run](https://github.com/kranthikiran885366/msd-project/actions/runs/45568930334) failed before any steps ran. The workflow page confirms: “The job was not started because your account is locked due to a billing issue.” GitHub also displays an account payment-method error. This requires the account owner to resolve billing; it is not a passing CI run or evidence of a code-test failure. Local results above remain separate. No billing settings were changed.

The control-plane smoke script is explicitly gated because it creates persistent records. Fresh signup mode is for disposable development configurations; production-mode staging requires a genuinely verified test account and SMTP/provider acceptance. Its optional deployment mode checks actual application HTTP but is only one acceptance case, not isolation/security/recovery certification.

No customer onboarding, production rollout, paid provisioning or real payment is authorized by these local results. See [HOSTING_PLAN.md](HOSTING_PLAN.md) for the ordered staging acceptance and provisioning checkpoint.

## Deployment lifecycle follow-up

The follow-up adds atomic revisioned lifecycle transitions, deployment-scoped worker claims, honest cleanup state, stop/termination, private persistent worker journals, restart recovery, HTTP runtime supervision, concurrency-safe port reuse and exact-byte GitHub push validation/deduplication. It also prevents hard project deletion from orphaning runtimes. See [DEPLOYMENT_LIFECYCLE.md](DEPLOYMENT_LIFECYCLE.md).

Latest local checks: 54 unit/transport tests passed, lint/type checks passed, strict Next build passed and all five HTTP/SSR/CSS checks passed. Three actual-MongoDB suites (12 tests) failed before their assertions could establish passing behavior. A direct MongoDB 7.0.24 probe exited 100 with `open: Operation not permitted`. A cold-download hook timeout was also corrected to allow a real 60-second setup window; using the cached binary confirmed the independent server-start restriction. No fake database or Docker stand-in was reported as E2E success.

Docker image build, running-container stop/restart/cancellation, public ingress/TLS, cloud orphan cleanup and retained registry-artifact rollback still require real staging acceptance. Local journal and controlled dependency tests do not establish a production tenant boundary. Shared-Docker production execution remains disabled.
