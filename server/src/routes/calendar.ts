import { Router } from 'express';
import * as calendarService from '../services/calendar.service';
import { validate } from '../middleware/validate';
import { createCalendarEventSchema, updateCalendarEventSchema } from '../schemas/calendar.schema';
import { cacheMiddleware } from '../cache';
import { parseIdFromQuery } from '../middleware/parseId';

const router = Router();

router.get('/', cacheMiddleware(30), async (req, res, next) => {
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

router.delete('/', parseIdFromQuery, async (req, res, next) => {
  try {
    const event = await calendarService.remove((req as any).parsedId);
    res.json({ message: 'Удалено', event });
  } catch (err) { next(err); }
});

export default router;
