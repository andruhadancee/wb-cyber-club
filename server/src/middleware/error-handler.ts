import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../app-error';
import logger from '../logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error({ err }, 'Unhandled server error');
  res.status(500).json({
    error: 'Ошибка сервера',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  });
}
