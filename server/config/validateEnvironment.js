'use strict';
module.exports = function validateEnvironment(env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  const errors = [];
  for (const name of ['JWT_SECRET', 'WORKER_SECRET', 'METRICS_PASSWORD']) {
    if (typeof env[name] !== 'string' || env[name].length < 32 || /^(change|your-|admin)/i.test(env[name])) errors.push(`${name} must be an independent secret of at least 32 characters`);
  }
  if (new Set([env.JWT_SECRET, env.WORKER_SECRET, env.METRICS_PASSWORD]).size !== 3) errors.push('JWT, worker and metrics secrets must be different');
  if (env.ENCRYPTION_KEY && env.ENCRYPTION_KEY.length < 32) errors.push('ENCRYPTION_KEY must contain at least 32 characters');
  for (const name of ['MONGODB_URI', 'REDIS_URL', 'CLIENT_URL']) if (!env[name]) errors.push(`${name} is required`);
  if (env.CLIENT_URL && !env.CLIENT_URL.startsWith('https://')) errors.push('CLIENT_URL must use HTTPS');
  if (errors.length) throw new Error(`Invalid production configuration: ${errors.join('; ')}`);
};
