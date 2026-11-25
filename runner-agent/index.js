#!/usr/bin/env node
'use strict';
require('dotenv').config();
process.env.QUEUE_MODE = 'bullmq';
const express = require('express');
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const Agent = require('./agent');
const JobExecutor = require('./jobExecutor');
const RuntimeSupervisor = require('./runtimeSupervisor');
const { assertDevelopmentExecutor } = require('./executionPolicy');
async function start() {
  assertDevelopmentExecutor();
  if (!process.env.WORKER_SECRET) throw new Error('WORKER_SECRET is required');
  if (process.env.NODE_ENV === 'production' && (!process.env.APPS_BASE_DOMAIN || process.env.APPS_BASE_DOMAIN === 'localhost')) throw new Error('APPS_BASE_DOMAIN and a separate application ingress are required in production');
  const options = { maxRetriesPerRequest: null, enableReadyCheck: false };
  const redis = process.env.REDIS_URL ? new IORedis(process.env.REDIS_URL, options) : new IORedis({ ...options, host: process.env.REDIS_HOST || '127.0.0.1', port: Number(process.env.REDIS_PORT || 6379), password: process.env.REDIS_PASSWORD || undefined });
  redis.on('error', error => console.error('[worker] Redis connection error:', error.message));
  const agent = new Agent();
  await redis.ping();
  await agent.start();
  const supervisor = new RuntimeSupervisor(agent.nodeId, agent.backendUrl);
  await supervisor.recover();
  const supervision = setInterval(() => supervisor.tick().catch(error => console.error('[supervisor]', error.message)), 15000);
  let active = 0; let stopping = false;
  const worker = new Worker('deployments', async job => {
    const executor = new JobExecutor(agent.nodeId, agent.backendUrl);
    const claim = await executor.client.post(`/api/deployments/${job.data.deploymentId}/claim`, { nodeId: agent.nodeId });
    if (claim.status !== 200) throw new Error('Deployment claim refused; automatic execution will not be repeated');
    if (!claim.data?.claimToken) throw new Error('Worker claim token missing');
    executor.client.defaults.headers.common['x-clouddeck-claim'] = claim.data.claimToken;
    await supervisor.remember(job.data.deploymentId, claim.data.claimToken, executor);
    active++;
    try { return await executor.executeJob({ deploymentId: job.data.deploymentId, data: job.data }); }
    finally { active--; }
  }, { connection: redis, concurrency: Number(process.env.MAX_CONCURRENT_JOBS || 2), maxStalledCount: 0 });
  worker.on('error', error => console.error('[worker] Queue error:', error.message));
  worker.on('failed', async (job, error) => {
    console.error(`[worker] Job ${job?.id} failed: ${error.message}`);
    // The executor owns fenced failure/cleanup reporting. A second unfenced
    // callback here could undo a committed running state after a lost response.
  });
  const app = express();
  app.get('/health', (req, res) => res.json({ status: 'healthy', nodeId: agent.nodeId, activeJobs: active }));
  app.get('/ready', (req, res) => { const ready = !stopping && agent.isRegistered && redis.status === 'ready'; res.status(ready ? 200 : 503).json({ ready }); });
  const server = app.listen(Number(process.env.WORKER_AGENT_PORT || 4000));
  async function shutdown() {
    if (stopping) return;
    stopping = true; server.close(); clearInterval(supervision);
    await worker.close(); await agent.shutdown(); await redis.quit();
  }
  process.once('SIGTERM', () => shutdown().catch(() => process.exit(1)));
  process.once('SIGINT', () => shutdown().catch(() => process.exit(1)));
}
if (require.main === module) start().catch(error => { console.error('[worker] Startup failed:', error.message); process.exit(1); });
module.exports = { start };
