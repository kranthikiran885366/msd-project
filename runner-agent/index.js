#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const { Worker: BullWorker } = require('bullmq');
const IORedis = require('ioredis');
const Agent = require('./agent');
const JobExecutor = require('./jobExecutor');

const PORT = process.env.WORKER_AGENT_PORT || 4000;

// ── BullMQ consumer — processes jobs directly from Redis ──────────────────
const redisConn = new IORedis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const executor = new JobExecutor(
    process.env.NODE_ID || 'worker-1',
    process.env.BACKEND_URL || 'http://backend:3001'
);

const bullWorker = new BullWorker('deployments', async (job) => {
    console.log(`[bullmq] Processing job ${job.id} — deployment ${job.data.deploymentId}`);
    await executor.executeJob({
        deploymentId: job.data.deploymentId,
        data: job.data,
        ...job.data,
    });
}, {
    connection: redisConn,
    concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),
});

bullWorker.on('completed', (job) => {
    console.log(`[bullmq] Job ${job.id} completed`);
});

bullWorker.on('failed', (job, err) => {
    console.error(`[bullmq] Job ${job?.id} failed:`, err.message);
});

console.log('[bullmq] Worker listening on deployments queue');

// ── Agent (heartbeat + node registration) ─────────────────────────────────
const agent = new Agent();

// ── Health HTTP server ─────────────────────────────────────────────────────
const app = express();

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        nodeId: agent.nodeId,
        uptime: process.uptime(),
        activeJobs: agent.activeJobs ? agent.activeJobs.size : 0,
    });
});

app.get('/ready', (req, res) => {
    res.status(200).json({ ready: true });
});

const server = app.listen(PORT, () => {
    console.log(`[worker-health] HTTP health server listening on port ${PORT}`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
async function shutdown() {
    console.log('[worker] Shutting down...');
    server.close();
    await bullWorker.close();
    await agent.shutdown().catch(() => {});
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ── Start agent (non-fatal if backend not ready yet) ──────────────────────
agent.start().catch((err) => {
    console.warn('[worker] Agent start warning (non-fatal):', err.message);
});
