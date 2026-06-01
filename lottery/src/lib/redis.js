import { createClient } from 'redis';

const globalForRedis = global || globalThis;

const redisClient =
  globalForRedis.redis ||
  createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || '',
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    },
  });

if (!globalForRedis.redis) {
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  
  // Connect to Redis
  redisClient.connect().catch(console.error);
  
  // Save to global context for development
  globalForRedis.redis = redisClient;
}

export default redisClient;
