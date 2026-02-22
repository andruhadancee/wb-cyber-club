import type { Request, Response, NextFunction } from 'express';
import { getRedis } from './redis';
import logger from './logger';

const DEFAULT_TTL_SEC = 60;

const memStore = new Map<string, { data: unknown; expiresAt: number }>();

function isRedisReady(): boolean {
  try {
    return getRedis().status === 'ready';
  } catch {
    return false;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (isRedisReady()) {
    try {
      const raw = await getRedis().get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.debug({ err, key }, 'Redis cacheGet failed, falling back');
    }
  }

  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export async function cacheSet<T>(key: string, data: T, ttlSec = DEFAULT_TTL_SEC): Promise<void> {
  if (isRedisReady()) {
    try {
      await getRedis().set(key, JSON.stringify(data), 'EX', ttlSec);
      return;
    } catch (err) {
      logger.debug({ err, key }, 'Redis cacheSet failed, falling back');
    }
  }

  memStore.set(key, { data, expiresAt: Date.now() + ttlSec * 1000 });
}

async function scanAndDelete(pattern: string): Promise<void> {
  const redis = getRedis();
  const match = `${pattern}*`;
  let cursor = '0';

  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', match, 'COUNT', 100);
    cursor = next;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== '0');
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  if (isRedisReady()) {
    try {
      await scanAndDelete(pattern);
    } catch (err) {
      logger.debug({ err, pattern }, 'Redis cacheInvalidate failed');
    }
  }

  for (const key of memStore.keys()) {
    if (key === pattern || key.startsWith(pattern)) {
      memStore.delete(key);
    }
  }
}

export async function cacheClear(): Promise<void> {
  if (isRedisReady()) {
    try {
      await getRedis().flushdb();
    } catch {
      // ignore
    }
  }
  memStore.clear();
}

export function cacheMiddleware(ttlSec = DEFAULT_TTL_SEC) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = `route:${req.originalUrl}`;

    cacheGet(key)
      .then((cached) => {
        if (cached) {
          res.json(cached);
          return;
        }

        const originalJson = res.json.bind(res);
        res.json = (data: unknown) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            cacheSet(key, data, ttlSec).catch(() => {});
          }
          return originalJson(data);
        };
        next();
      })
      .catch(() => next());
  };
}
