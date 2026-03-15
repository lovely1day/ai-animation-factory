import IORedis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

const redisOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
};

export const redis = new IORedis(redisOptions);

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ error: err.message }, 'Redis error'));
redis.on('close', () => logger.warn('Redis connection closed'));

// Separate connection options object for BullMQ workers/queues
export const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};
