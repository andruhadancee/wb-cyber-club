import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function devBasicAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Dev"');
    res.status(401).send('Authorization required');
    return;
  }

  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user === config.DEV_USER && pass === config.DEV_PASS) {
    next();
    return;
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Dev"');
  res.status(401).send('Invalid credentials');
}
