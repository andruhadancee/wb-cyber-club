import { Router } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { signAdminToken, adminCookieOptions, JWT_COOKIE, requireAdmin } from '../middleware/admin-auth';

const router = Router();

function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

router.post('/login', (req, res) => {
  const { password } = req.body as { password?: string };

  if (!config.ADMIN_PASSWORD) {
    res.status(503).json({ error: 'Пароль администратора не настроен' });
    return;
  }

  if (password && timingSafeCompare(password, config.ADMIN_PASSWORD)) {
    const token = signAdminToken();
    res.cookie(JWT_COOKIE, token, adminCookieOptions());
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Неверный пароль' });
  }
});

router.post('/logout', (_req, res) => {
  res.cookie(JWT_COOKIE, '', adminCookieOptions(true));
  res.json({ ok: true });
});

router.get('/check', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

export default router;
