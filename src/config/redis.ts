import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const isTLS = env.REDIS_URL?.startsWith('rediss://');

export const redis = new Redis(env.REDIS_URL as string, {
  ...(isTLS ? { tls: {} } : {}),

  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false, 
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error(err, '❌ Redis error');
});