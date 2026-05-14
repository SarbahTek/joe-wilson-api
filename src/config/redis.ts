import Redis from 'ioredis';
import { env } from './env';

const useTLS = env.REDIS_URL.startsWith('redis://')

export const redis = new Redis(env.REDIS_URL, {
  ...(useTLS ? {tls : {}} : {}),
  maxRetriesPerRequest: null,
  lazyConnect: true,
});



