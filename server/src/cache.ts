import type { Request, Response, NextFunction } from 'express';

const DEFAULT_TTL = 60_000; // 60 seconds

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  store.set(key, { data, expiresAt: Date.now() + ttl });
}

export function cacheInvalidate(pattern: string): void {
  for (const key of store.keys()) {
    if (key === pattern || key.startsWith(pattern)) {
      store.delete(key);
    }
  }
}

export function cacheClear(): void {
  store.clear();
}

/**
 * Express middleware: caches GET responses by req.originalUrl.
 * Use only for read-heavy routes.
 */
export function cacheMiddleware(ttl = DEFAULT_TTL) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = `route:${req.originalUrl}`;
    const cached = cacheGet(key);
    if (cached) {
      res.json(cached);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (data: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
}
