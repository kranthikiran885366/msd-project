// Unified environment configuration — AWS EC2 / generic cloud
// All GCP metadata references removed. Values come from environment variables only.
'use strict';

function required(name) {
  const val = process.env[name];
  if (!val && process.env.NODE_ENV === 'production') {
    console.warn(`[config] WARNING: required env var ${name} is not set`);
  }
  return val;
}

const config = {
  // ── Server ────────────────────────────────────────────────────────────────
  port:    parseInt(process.env.BACKEND_PORT || process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // ── Public / private addressing ───────────────────────────────────────────
  // BACKEND_PUBLIC_URL  — reachable by browsers / frontend (EC2 public IP or ELB)
  // BACKEND_PRIVATE_IP  — reachable by worker nodes on the same VPC
  publicUrl:  process.env.BACKEND_PUBLIC_URL  || `http://localhost:${process.env.PORT || 3001}`,
  privateIp:  process.env.BACKEND_PRIVATE_IP  || '127.0.0.1',

  // Legacy aliases kept for backward compatibility
  get apiUrl()    { return this.publicUrl; },
  get clientUrl() { return process.env.CLIENT_URL || 'http://localhost:3000'; },

  // ── Database ──────────────────────────────────────────────────────────────
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/clouddeck',

  // ── Redis ─────────────────────────────────────────────────────────────────
  redis: {
    host:     process.env.REDIS_HOST     || 'localhost',
    port:     parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    url:      process.env.REDIS_URL      || undefined,
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',

  // ── Worker / deployment ───────────────────────────────────────────────────
  deploymentStrategy: process.env.DEPLOYMENT_STRATEGY || 'internal',
  dockerEnabled:      process.env.DOCKER_ENABLED === 'true',
  nodeId:             process.env.NODE_ID   || 'backend-1',
  nodeIp:             process.env.NODE_IP   || '127.0.0.1',
  region:             process.env.REGION    || 'us-east-1',
  portRangeStart:     parseInt(process.env.PORT_RANGE_START || '4000', 10),
  portRangeEnd:       parseInt(process.env.PORT_RANGE_END   || '5000', 10),
  maxConcurrentJobs:  parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),

  // ── Internal worker auth ──────────────────────────────────────────────────
  // Shared secret used by worker nodes to authenticate internal callbacks.
  // Workers must send:  Authorization: Bearer <WORKER_SECRET>
  workerSecret: process.env.WORKER_SECRET || '',

  // ── Metrics ───────────────────────────────────────────────────────────────
  metricsUsername: process.env.METRICS_USERNAME || 'admin',
  metricsPassword: process.env.METRICS_PASSWORD || 'admin',

  // ── Logging ───────────────────────────────────────────────────────────────
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
