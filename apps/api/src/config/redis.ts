import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

// Redis configuration with fallback for local development
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true, // Don't connect immediately
};

// For Upstash Redis (HTTP REST API)
const upstashConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
};

// Determine which Redis to use
const useUpstash = !!upstashConfig.url && !!upstashConfig.token;

// Create Redis client
export let redis: Redis;
export let redisConnection: any;

try {
  if (useUpstash) {
    // Upstash Redis configuration
    logger.info('Using Upstash Redis (HTTP REST)');
    redis = new Redis({
      host: upstashConfig.url!.replace('https://', ''),
      port: 443,
      password: upstashConfig.token,
      tls: {}, // Required for Upstash
      ...redisConfig,
    });
    redisConnection = {
      host: upstashConfig.url,
      port: 443,
      tls: {},
    };
  } else {
    // Standard Redis (local or Docker)
    logger.info(`Using Redis at ${redisConfig.host}:${redisConfig.port}`);
    redis = new Redis(redisConfig);
    redisConnection = redisConfig;
  }

  // Handle Redis events
  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (err) => {
    logger.error({ error: err.message }, 'Redis connection error');
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

} catch (error) {
  logger.error({ error }, 'Failed to initialize Redis');
  // Create a dummy Redis client for development
  redis = {} as Redis;
  redisConnection = redisConfig;
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    return false;
  }
}

// Graceful shutdown
export async function closeRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error({ error }, 'Error closing Redis connection');
  }
}
