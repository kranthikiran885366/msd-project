const Redis = require('ioredis');

const redisConnectionOptions = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 10) return null;
        return Math.min(times * 100, 3000);
      },
    };

const client = new Redis(redisConnectionOptions);

client.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

module.exports = client;
