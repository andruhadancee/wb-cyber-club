import type { Request } from 'express';
import rateLimit, { type Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../redis';
import logger from '../logger';

const isDev = process.env.NODE_ENV !== 'production';

const keyGenerator = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';

const onLimitReached = (req: Request): void => {
  logger.warn({ ip: keyGenerator(req), url: req.originalUrl }, 'Rate limit exceeded');
};

function getStore(): Partial<Options> {
  try {
    const store = new RedisStore({
      sendCommand: (...args: string[]) =>
        getRedis().call(...(args as [string, ...string[]])) as any,
      prefix: 'rl:',
    });
    return { store };
  } catch {
    logger.debug('Redis unavailable for rate limiter, using memory store');
    return {};
  }
}

const storeOpts = getStore();

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: isDev ? 500 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  ...storeOpts,
  handler: (req, res) => {
    onLimitReached(req);
    res.status(429).json({ error: 'Слишком много запросов, попробуйте позже' });
  },
});

export const mutationLimiter = rateLimit({
  windowMs: 60_000,
  max: isDev ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  ...storeOpts,
  handler: (req, res) => {
    onLimitReached(req);
    res.status(429).json({ error: 'Слишком много запросов на изменение данных' });
  },
});
