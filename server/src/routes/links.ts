import { Router } from 'express';
import * as linkService from '../services/link.service';
import { validate } from '../middleware/validate';
import { saveLinksSchema } from '../schemas/link.schema';
import { cacheMiddleware } from '../cache';

const router = Router();

router.get('/', cacheMiddleware(60_000), async (_req, res, next) => {
  try {
    const links = await linkService.getAll();
    res.json(links);
  } catch (err) { next(err); }
});

router.post('/', validate(saveLinksSchema), async (req, res, next) => {
  try {
    await linkService.save(req.body);
    res.json({ message: 'Ссылки сохранены', links: req.body });
  } catch (err) { next(err); }
});

export default router;
