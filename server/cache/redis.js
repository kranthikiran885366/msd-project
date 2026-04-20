const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error('Redis retry limit exceeded');
      return Math.min(retries * 100, 3000);
    },
  },
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

// Connect on module load — redis v4 requires explicit connect()
client.connect().catch((err) => {
  console.warn('Redis initial connect failed (will retry):', err.message);
});

module.exports = client;
