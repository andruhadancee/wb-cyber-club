import { Router } from 'express';
import * as disciplineService from '../services/discipline.service';
import { validate } from '../middleware/validate';
import { createDisciplineSchema, updateDisciplineSchema } from '../schemas/discipline.schema';
import { cacheMiddleware } from '../cache';

const router = Router();

router.get('/', cacheMiddleware(60), async (_req, res, next) => {
  try {
    const disciplines = await disciplineService.getAll();
    res.json(disciplines);
  } catch (err) { next(err); }
});

router.post('/', validate(createDisciplineSchema), async (req, res, next) => {
  try {
    const discipline = await disciplineService.create(req.body);
    res.status(201).json(discipline);
  } catch (err) { next(err); }
});

router.put('/', validate(updateDisciplineSchema), async (req, res, next) => {
  try {
    const discipline = await disciplineService.update(req.body);
    res.json(discipline);
  } catch (err) { next(err); }
});

router.delete('/', async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Параметр id обязателен' });
      return;
    }
    await disciplineService.remove(id);
    res.json({ message: 'Дисциплина удалена' });
  } catch (err) { next(err); }
});

export default router;
