import Redis from 'ioredis';
import logger from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 3000),
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
