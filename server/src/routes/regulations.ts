import { Router } from 'express';
import * as regulationService from '../services/regulation.service';
import { validate } from '../middleware/validate';
import { createRegulationSchema, updateRegulationSchema } from '../schemas/regulation.schema';
import { parseIdFromQuery } from '../middleware/parseId';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const discipline = req.query.discipline as string | undefined;
    const regulations = await regulationService.getAll(discipline);
    res.json(regulations);
  } catch (err) { next(err); }
});

router.post('/', validate(createRegulationSchema), async (req, res, next) => {
  try {
    const regulation = await regulationService.create(req.body);
    res.status(201).json(regulation);
  } catch (err) { next(err); }
});

router.put('/', parseIdFromQuery, validate(updateRegulationSchema), async (req, res, next) => {
  try {
    const regulation = await regulationService.update((req as any).parsedId, req.body);
    res.json(regulation);
  } catch (err) { next(err); }
});

router.delete('/', parseIdFromQuery, async (req, res, next) => {
  try {
    await regulationService.remove((req as any).parsedId);
    res.json({ message: 'Регламент удалён' });
  } catch (err) { next(err); }
});

export default router;
