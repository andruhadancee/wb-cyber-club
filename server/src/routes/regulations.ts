import { Router } from 'express';
import * as regulationService from '../services/regulation.service';
import { validate } from '../middleware/validate';
import { createRegulationSchema, updateRegulationSchema } from '../schemas/regulation.schema';

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

router.put('/', async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    const data = updateRegulationSchema.parse(req.body);
    const regulation = await regulationService.update(id, data);
    res.json(regulation);
  } catch (err) { next(err); }
});

router.delete('/', async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    await regulationService.remove(id);
    res.json({ message: 'Regulation deleted successfully' });
  } catch (err) { next(err); }
});

export default router;
