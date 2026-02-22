import { Router } from 'express';
import * as socialService from '../services/social.service';
import { validate } from '../middleware/validate';
import { saveSocialLinksSchema } from '../schemas/social.schema';
import { cacheMiddleware } from '../cache';

const router = Router();

router.get('/', cacheMiddleware(60), async (_req, res, next) => {
  try {
    const links = await socialService.getAll();
    res.json(links);
  } catch (err) { next(err); }
});

router.post('/', validate(saveSocialLinksSchema), async (req, res, next) => {
  try {
    await socialService.save(req.body);
    res.json({ message: 'Социальные ссылки сохранены' });
  } catch (err) { next(err); }
});

export default router;
