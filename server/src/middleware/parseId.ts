import type { Request, Response, NextFunction } from 'express';

/**
 * Parse and validate numeric `id` from query string.
 * Sets `req.parsedId` for downstream use.
 */
export function parseIdFromQuery(req: Request, res: Response, next: NextFunction): void {
  const raw = req.query.id;
  const id = Number(raw);
  if (!raw || isNaN(id) || id <= 0 || !Number.isInteger(id)) {
    res.status(400).json({ error: 'Параметр id обязателен и должен быть положительным целым числом' });
    return;
  }
  (req as any).parsedId = id;
  next();
}
