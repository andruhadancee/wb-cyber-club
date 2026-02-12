import { Router } from 'express';
import * as calendarService from '../services/calendar.service';
import { validate } from '../middleware/validate';
import { createCalendarEventSchema, updateCalendarEventSchema } from '../schemas/calendar.schema';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const month = req.query.month as string | undefined;
    const events = await calendarService.getAll(month);
    res.json(events);
  } catch (err) { next(err); }
});

router.post('/', validate(createCalendarEventSchema), async (req, res, next) => {
  try {
    const event = await calendarService.create(req.body);
    res.status(201).json(event);
  } catch (err) { next(err); }
});

router.put('/', validate(updateCalendarEventSchema), async (req, res, next) => {
  try {
    const event = await calendarService.update(req.body);
    res.json(event);
  } catch (err) { next(err); }
});

router.delete('/', async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    const event = await calendarService.remove(id);
    res.json({ message: 'Удалено', event });
  } catch (err) { next(err); }
});

export default router;
