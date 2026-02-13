import { Router } from 'express';
import * as teamService from '../services/team.service';
import { validate } from '../middleware/validate';
import { createTeamSchema, updateTeamSchema } from '../schemas/team.schema';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const tournamentId = req.query.tournamentId
      ? Number(req.query.tournamentId)
      : undefined;
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

router.put('/', validate(updateTeamSchema), async (req, res, next) => {
  try {
    const team = await teamService.update(req.body);
    res.json(team);
  } catch (err) { next(err); }
});

router.delete('/', async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    await teamService.remove(id);
    res.json({ message: 'Команда удалена' });
  } catch (err) { next(err); }
});

export default router;
