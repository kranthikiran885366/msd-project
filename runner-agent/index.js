#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const Agent = require('./agent');

const agent = new Agent();
const app = express();
const PORT = process.env.WORKER_AGENT_PORT || 4000;

// Health check endpoint
app.get('/health', (req, res) => {
    if (agent.isRunning) {
        res.status(200).json({
            status: 'healthy',
            nodeId: agent.nodeId,
            uptime: process.uptime(),
            activeJobs: agent.activeJobs ? agent.activeJobs.size : 0
        });
    } else {
        res.status(503).json({
            status: 'unhealthy',
            error: 'Agent not running'
        });
    }
});

// Readiness check
app.get('/ready', (req, res) => {
    if (agent.isRunning && agent.isRegistered) {
        res.status(200).json({ ready: true });
    } else {
        res.status(503).json({ ready: false });
    }
});

// Start HTTP server
const server = app.listen(PORT, () => {
    console.log(`[worker-health] HTTP health server listening on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[worker] SIGTERM received, shutting down gracefully...');
    server.close();
    await agent.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('[worker] SIGINT received, shutting down gracefully...');
    server.close();
    await agent.shutdown();
    process.exit(0);
});

// Start the agent
agent.start().catch((error) => {
    console.error('[worker] Fatal error starting agent:', error);
    process.exit(1);
});
