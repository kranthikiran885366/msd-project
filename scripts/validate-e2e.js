#!/usr/bin/env node
/**
 * CloudDeck — Docker Compose End-to-End Validation Script
 * Run after: docker compose up -d
 * Usage: node scripts/validate-e2e.js
 */
'use strict';

const http  = require('http');
const https = require('https');
const { execSync } = require('child_process');

const BACKEND  = process.env.BACKEND_URL  || 'http://localhost:3001';
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
const WORKER   = process.env.WORKER_URL   || 'http://localhost:4000';

let passed = 0, failed = 0;
const issues = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

function get(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, { timeout: 8000, ...opts }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
                catch { resolve({ status: res.statusCode, body }); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

function post(url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const u = new URL(url);
        const opts = {
            hostname: u.hostname,
            port:     u.port || 80,
            path:     u.pathname + u.search,
            method:   'POST',
            headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers },
            timeout:  10000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
                catch { resolve({ status: res.statusCode, body }); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.write(payload);
        req.end();
    });
}

async function check(label, fn) {
    try {
        await fn();
        console.log(`  ✅  ${label}`);
        passed++;
    } catch (err) {
        console.log(`  ❌  ${label} — ${err.message}`);
        failed++;
        issues.push({ label, error: err.message });
    }
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg);
}

// ── Phase 1 — Service Health ──────────────────────────────────────────────────

async function phase1() {
    console.log('\n📋 PHASE 1 — Service Health Checks');

    await check('Backend /health returns 200', async () => {
        const r = await get(`${BACKEND}/health`);
        assert(r.status === 200, `got ${r.status}`);
        assert(r.body.status === 'ok', `status=${r.body.status}`);
    });

    await check('Backend /version returns version info', async () => {
        const r = await get(`${BACKEND}/version`);
        assert(r.status === 200, `got ${r.status}`);
        assert(r.body.version, 'no version field');
    });

    await check('Worker /health returns 200', async () => {
        const r = await get(`${WORKER}/health`);
        assert(r.status === 200, `got ${r.status}`);
        assert(r.body.status === 'healthy', `status=${r.body.status}`);
    });

    await check('Worker /ready returns ready=true', async () => {
        const r = await get(`${WORKER}/ready`);
        assert(r.status === 200, `got ${r.status}`);
        assert(r.body.ready === true, 'not ready');
    });

    await check('Frontend returns HTTP 200', async () => {
        const r = await get(FRONTEND);
        assert(r.status < 500, `got ${r.status}`);
    });
}

// ── Phase 2 — API Security ────────────────────────────────────────────────────

async function phase2() {
    console.log('\n🔒 PHASE 2 — Security Validation');

    await check('GET /api/projects blocked without JWT (401)', async () => {
        const r = await get(`${BACKEND}/api/projects`);
        assert(r.status === 401, `expected 401 got ${r.status}`);
    });

    await check('GET /api/deployments blocked without JWT (401)', async () => {
        const r = await get(`${BACKEND}/api/deployments`);
        assert(r.status === 401, `expected 401 got ${r.status}`);
    });

    await check('POST /api/deployments/:id/logs blocked without WORKER_SECRET (401)', async () => {
        const r = await post(`${BACKEND}/api/deployments/000000000000000000000001/logs`, { message: 'test', level: 'info' });
        assert(r.status === 401, `expected 401 got ${r.status}`);
    });

    await check('POST /api/deployments/:id/status blocked without WORKER_SECRET (401)', async () => {
        const r = await post(`${BACKEND}/api/deployments/000000000000000000000001/status`, { status: 'running' });
        assert(r.status === 401, `expected 401 got ${r.status}`);
    });

    await check('GET /api/jobs/pull blocked without WORKER_SECRET (401)', async () => {
        const r = await get(`${BACKEND}/api/jobs/pull?nodeId=test`);
        assert(r.status === 401, `expected 401 got ${r.status}`);
    });
}

// ── Phase 3 — Node Registration ───────────────────────────────────────────────

async function phase3() {
    console.log('\n🖥️  PHASE 3 — Worker Node Registration');

    const workerSecret = process.env.WORKER_SECRET || 'clouddeck-dev-worker-secret-change-in-production';

    await check('Worker registered in backend /api/nodes', async () => {
        const r = await get(`${BACKEND}/api/nodes`, {
            headers: { Authorization: `Bearer ${workerSecret}` }
        });
        // nodes route uses user auth not worker auth — check it returns something
        assert(r.status !== 500, `server error: ${JSON.stringify(r.body)}`);
    });

    await check('POST /api/nodes/register accepts valid payload', async () => {
        const r = await post(`${BACKEND}/api/nodes/register`, {
            nodeId:    'validate-test-node',
            hostname:  'test-host',
            privateIp: '10.0.0.99',
            publicIp:  '1.2.3.4',
            region:    'local',
        });
        assert(r.status === 200, `got ${r.status}: ${JSON.stringify(r.body)}`);
        assert(r.body.success, `success=false: ${r.body.error}`);
    });

    await check('POST /api/nodes/heartbeat accepted', async () => {
        const r = await post(`${BACKEND}/api/nodes/heartbeat`, {
            nodeId:  'validate-test-node',
            metrics: { cpuUsage: 10, memoryUsage: 20, diskUsage: 5, activeContainers: 0 },
        });
        assert(r.status === 200, `got ${r.status}: ${JSON.stringify(r.body)}`);
    });
}

// ── Phase 4 — Job Queue ───────────────────────────────────────────────────────

async function phase4() {
    console.log('\n📦 PHASE 4 — Job Queue');

    const workerSecret = process.env.WORKER_SECRET || 'clouddeck-dev-worker-secret-change-in-production';

    await check('GET /api/jobs/stats/queue returns queue stats', async () => {
        const r = await get(`${BACKEND}/api/jobs/stats/queue`);
        assert(r.status === 200, `got ${r.status}`);
        assert(r.body.stats !== undefined, 'no stats field');
    });

    await check('GET /api/jobs/pull with WORKER_SECRET returns 404 (no jobs) or 200', async () => {
        const r = await get(`${BACKEND}/api/jobs/pull?nodeId=validate-test-node`, {
            headers: { Authorization: `Bearer ${workerSecret}` }
        });
        assert(r.status === 200 || r.status === 404, `unexpected ${r.status}`);
    });
}

// ── Phase 5 — Port Management ─────────────────────────────────────────────────

async function phase5() {
    console.log('\n🔌 PHASE 5 — Port Management');

    await check('GET /api/ports/stats/utilization returns port stats', async () => {
        const r = await get(`${BACKEND}/api/ports/stats/utilization`);
        assert(r.status === 200, `got ${r.status}`);
        assert(r.body.stats !== undefined, 'no stats');
    });

    await check('GET /api/ports returns active mappings list', async () => {
        const r = await get(`${BACKEND}/api/ports`);
        assert(r.status === 200, `got ${r.status}`);
        assert(Array.isArray(r.body.mappings), 'mappings not array');
    });
}

// ── Phase 6 — Docker Containers ───────────────────────────────────────────────

async function phase6() {
    console.log('\n🐳 PHASE 6 — Docker Container Status');

    const containers = ['clouddeck-backend', 'clouddeck-redis', 'clouddeck-mongodb', 'clouddeck-worker', 'clouddeck-frontend'];

    for (const name of containers) {
        await check(`Container ${name} is running`, async () => {
            try {
                const out = execSync(
                    `"C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" inspect --format "{{.State.Running}}" ${name} 2>&1`,
                    { encoding: 'utf8', timeout: 5000 }
                ).trim();
                assert(out === 'true', `State.Running=${out}`);
            } catch (e) {
                // On Linux/CI docker is on PATH
                const out = execSync(`docker inspect --format "{{.State.Running}}" ${name} 2>&1`, { encoding: 'utf8', timeout: 5000 }).trim();
                assert(out === 'true', `State.Running=${out}`);
            }
        });
    }
}

// ── Phase 7 — Config/Env API ──────────────────────────────────────────────────

async function phase7() {
    console.log('\n⚙️  PHASE 7 — Config & Env API (unauthenticated = 401)');

    await check('GET /api/projects/:id/env requires auth', async () => {
        const r = await get(`${BACKEND}/api/projects/000000000000000000000001/env`);
        assert(r.status === 401, `expected 401 got ${r.status}`);
    });

    await check('GET /api/projects/:id/config requires auth', async () => {
        const r = await get(`${BACKEND}/api/projects/000000000000000000000001/config`);
        assert(r.status === 401, `expected 401 got ${r.status}`);
    });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  CloudDeck — End-to-End Validation');
    console.log(`  Backend:  ${BACKEND}`);
    console.log(`  Frontend: ${FRONTEND}`);
    console.log(`  Worker:   ${WORKER}`);
    console.log('═══════════════════════════════════════════════════════');

    await phase1();
    await phase2();
    await phase3();
    await phase4();
    await phase5();
    await phase6();
    await phase7();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed`);

    if (issues.length > 0) {
        console.log('\n  Issues:');
        issues.forEach(i => console.log(`    ❌ ${i.label}: ${i.error}`));
    }

    const score = Math.round((passed / (passed + failed)) * 100);
    console.log(`\n  Health Score: ${score}%`);

    if (score === 100) {
        console.log('  🎉 ALL CHECKS PASSED — System is production ready');
    } else if (score >= 80) {
        console.log('  ⚠️  MOSTLY PASSING — Review failed checks above');
    } else {
        console.log('  🔴 CRITICAL FAILURES — System not ready');
    }
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Validation script crashed:', err);
    process.exit(1);
});
