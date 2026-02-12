import { Router } from 'express';
import * as bracketService from '../services/bracket.service';
import { validate } from '../middleware/validate';
import { generateBracketSchema, updateMatchSchema } from '../schemas/bracket.schema';
import { cacheMiddleware } from '../cache';

const router = Router();

/** GET /api/brackets?tournamentId=X — public */
router.get('/', cacheMiddleware(30_000), async (req, res, next) => {
  try {
    const tournamentId = Number(req.query.tournamentId);
    if (!tournamentId) {
      res.status(400).json({ error: 'tournamentId is required' });
      return;
    }
    const matches = await bracketService.getByTournament(tournamentId);
    res.json(matches);
  } catch (err) { next(err); }
});

/** POST /api/brackets/generate — admin */
router.post('/generate', validate(generateBracketSchema), async (req, res, next) => {
  try {
    const matches = await bracketService.generate(req.body.tournamentId, req.body.format);
    res.status(201).json(matches);
  } catch (err) { next(err); }
});

/** PUT /api/brackets/:id — admin */
router.put('/:id', validate(updateMatchSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const match = await bracketService.updateMatch(id, req.body);
    res.json(match);
  } catch (err) { next(err); }
});

/** DELETE /api/brackets?tournamentId=X — admin */
router.delete('/', async (req, res, next) => {
  try {
    const tournamentId = Number(req.query.tournamentId);
    if (!tournamentId) {
      res.status(400).json({ error: 'tournamentId is required' });
      return;
    }
    await bracketService.deleteByTournament(tournamentId);
    res.json({ message: 'Сетка удалена' });
  } catch (err) { next(err); }
});

export default router;
