import { Router } from 'express';
import { config } from '../config';

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body as { password?: string };

  if (!config.ADMIN_PASSWORD) {
    res.status(503).json({ error: 'Пароль администратора не настроен' });
    return;
  }

  if (password === config.ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Неверный пароль' });
  }
});

export default router;
