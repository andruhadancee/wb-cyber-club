import { Router } from 'express';
import prisma from '../prisma';
import { getRedis } from '../redis';

const router = Router();

router.get('/', async (_req, res) => {
  const checks: Record<string, 'ok' | 'unavailable'> = { db: 'unavailable', redis: 'unavailable' };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch { /* keep unavailable */ }

  try {
    const redis = getRedis();
    if (redis.status === 'ready') {
      await redis.ping();
      checks.redis = 'ok';
    }
  } catch { /* keep unavailable */ }

  const healthy = checks.db === 'ok';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
