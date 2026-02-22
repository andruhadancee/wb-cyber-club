import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../logger';

const isDev = process.env.NODE_ENV !== 'production';

const keyGenerator = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';

const onLimitReached = (req: Request): void => {
  logger.warn({ ip: keyGenerator(req), url: req.originalUrl }, 'Rate limit exceeded');
};

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: isDev ? 500 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
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
  handler: (req, res) => {
    onLimitReached(req);
    res.status(429).json({ error: 'Слишком много запросов на изменение данных' });
  },
});
