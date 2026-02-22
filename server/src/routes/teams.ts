import { Router } from 'express';
import * as teamService from '../services/team.service';
import { validate } from '../middleware/validate';
import { createTeamSchema, updateTeamSchema, bulkCreateTeamSchema } from '../schemas/team.schema';
import { parseIdFromQuery } from '../middleware/parseId';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const tournamentId = req.query.tournamentId
      ? Number(req.query.tournamentId)
      : undefined;
    if (tournamentId !== undefined && (isNaN(tournamentId) || tournamentId <= 0)) {
      res.status(400).json({ error: 'Некорректный tournamentId' });
      return;
    }
    const status = (req.query.status as string) || undefined;
    const teams = await teamService.getAll(tournamentId, status);
    res.json(teams);
  } catch (err) { next(err); }
});

router.post('/', validate(createTeamSchema), async (req, res, next) => {
  try {
    const team = await teamService.create(req.body);
    res.status(201).json(team);
  } catch (err) { next(err); }
});

router.post('/bulk', validate(bulkCreateTeamSchema), async (req, res, next) => {
  try {
    const result = await teamService.bulkCreate(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.put('/', validate(updateTeamSchema), async (req, res, next) => {
  try {
    const team = await teamService.update(req.body);
    res.json(team);
  } catch (err) { next(err); }
});

router.delete('/', parseIdFromQuery, async (req, res, next) => {
  try {
    await teamService.remove((req as any).parsedId);
    res.json({ message: 'Команда удалена' });
  } catch (err) { next(err); }
});

router.delete('/by-tournament', async (req, res, next) => {
  try {
    const tournamentId = Number(req.query.tournamentId);
    if (!tournamentId || isNaN(tournamentId) || tournamentId <= 0) {
      res.status(400).json({ error: 'Некорректный tournamentId' });
      return;
    }
    const result = await teamService.removeByTournament(tournamentId);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
