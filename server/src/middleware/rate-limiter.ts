import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: isDev ? 500 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов, попробуйте позже' },
});

export const mutationLimiter = rateLimit({
  windowMs: 60_000,
  max: isDev ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов, попробуйте позже' },
});
