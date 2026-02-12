import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../app-error';

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

  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Ошибка сервера', details: err.message });
}
