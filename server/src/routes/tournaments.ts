import { Router } from 'express';
import * as tournamentService from '../services/tournament.service';
import { validate } from '../middleware/validate';
import { createTournamentSchema, updateTournamentSchema } from '../schemas/tournament.schema';
import { cacheMiddleware } from '../cache';
import { parseIdFromQuery } from '../middleware/parseId';

const router = Router();

router.get('/', cacheMiddleware(30_000), async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const tournaments = await tournamentService.getAll(status);
    res.json(tournaments);
  } catch (err) { next(err); }
});

router.post('/', validate(createTournamentSchema), async (req, res, next) => {
  try {
    const tournament = await tournamentService.create(req.body);
    res.status(201).json(tournament);
  } catch (err) { next(err); }
});

router.put('/', validate(updateTournamentSchema), async (req, res, next) => {
  try {
    const tournament = await tournamentService.update(req.body);
    res.json(tournament);
  } catch (err) { next(err); }
});

router.delete('/', parseIdFromQuery, async (req, res, next) => {
  try {
    const tournament = await tournamentService.remove((req as any).parsedId);
    res.json({ message: 'Турнир удалён', tournament });
  } catch (err) { next(err); }
});

export default router;
