import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const JWT_COOKIE = 'admin_token';
const JWT_EXPIRY = '24h';

function getSecret(): string {
  return config.JWT_SECRET || `__derived__${config.ADMIN_PASSWORD}__`;
}

export function signAdminToken(): string {
  return jwt.sign({ role: 'admin' }, getSecret(), { expiresIn: JWT_EXPIRY });
}

export function adminCookieOptions(clear = false): {
  httpOnly: boolean;
  sameSite: 'strict';
  secure: boolean;
  path: string;
  maxAge?: number;
} {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.NODE_ENV === 'production',
    path: '/',
    ...(clear ? { maxAge: 0 } : { maxAge: 24 * 60 * 60 * 1000 }),
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[JWT_COOKIE];

  if (!token) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  try {
    jwt.verify(token, getSecret());
    next();
  } catch {
    res.status(401).json({ error: 'Сессия истекла, войдите снова' });
  }
}

export { JWT_COOKIE };
