import { Router } from 'express';

import tournamentsRouter from './tournaments';
import teamsRouter from './teams';
import calendarRouter from './calendar';
import disciplinesRouter from './disciplines';
import linksRouter from './links';
import regulationsRouter from './regulations';
import socialRouter from './social';
import bracketsRouter from './brackets';
import archiveRouter from './archive';
import healthRouter from './health';

const router = Router();

router.use('/health', healthRouter);
router.use('/tournaments', tournamentsRouter);
router.use('/brackets', bracketsRouter);
router.use('/teams', teamsRouter);
router.use('/calendar', calendarRouter);
router.use('/disciplines', disciplinesRouter);
router.use('/links', linksRouter);
router.use('/regulations', regulationsRouter);
router.use('/social', socialRouter);
router.use('/archive-auto', archiveRouter);

export default router;
