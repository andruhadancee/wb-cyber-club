import Redis from 'ioredis';
import { config } from './config';
import logger from './logger';

const REDIS_URL = config.REDIS_URL;

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 5) return null;
        return Math.min(times * 500, 3000);
      },
      lazyConnect: true,
    });

    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', (err) => logger.warn({ err: err.message }, 'Redis error'));
  }
  return client;
}

export async function connectRedis(): Promise<boolean> {
  try {
    const redis = getRedis();
    if (redis.status === 'ready' || redis.status === 'connecting') {
      return redis.status === 'ready';
    }
    await redis.connect();
    return true;
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : err }, 'Redis unavailable — using in-memory cache');
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => {});
    client = null;
  }
}
