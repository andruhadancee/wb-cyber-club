import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../middleware/admin-auth';

import tournamentsRouter from './tournaments';
import teamsRouter from './teams';
import calendarRouter from './calendar';
import disciplinesRouter from './disciplines';
import linksRouter from './links';
import regulationsRouter from './regulations';
import socialRouter from './social';
import bracketsRouter from './brackets';
import healthRouter from './health';
import uploadRouter from './upload';
import adminRouter from './admin';

const router = Router();

function adminOnMutation(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    requireAdmin(req, res, next);
    return;
  }
  next();
}

router.use('/health', healthRouter);
router.use('/admin', adminRouter);
router.use('/tournaments', adminOnMutation, tournamentsRouter);
router.use('/brackets', adminOnMutation, bracketsRouter);
router.use('/teams', adminOnMutation, teamsRouter);
router.use('/calendar', adminOnMutation, calendarRouter);
router.use('/disciplines', adminOnMutation, disciplinesRouter);
router.use('/links', adminOnMutation, linksRouter);
router.use('/regulations', adminOnMutation, regulationsRouter);
router.use('/social', adminOnMutation, socialRouter);
router.use('/upload', requireAdmin, uploadRouter);

export default router;
