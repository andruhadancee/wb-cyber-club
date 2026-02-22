import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../app-error';
import { Sentry } from '../sentry';
import { sendErrorToTelegram } from '../telegram';
import logger from '../logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const reqId = (req as any).id ?? req.headers['x-request-id'] ?? undefined;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, ...(reqId && { requestId: reqId }) });
    return;
  }

  Sentry.captureException(err, {
    extra: { reqId, url: req.originalUrl, method: req.method },
  });

  sendErrorToTelegram({
    error: err,
    url: req.originalUrl,
    method: req.method,
    requestId: reqId,
  }).catch(() => {});

  logger.error({ err, reqId }, 'Unhandled server error');
  res.status(500).json({
    error: 'Ошибка сервера',
    ...(reqId && { requestId: reqId }),
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  });
}
