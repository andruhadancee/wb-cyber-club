import { Router } from 'express';
import * as archiveService from '../services/archive.service';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await archiveService.autoArchive();
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
