import { initSentry } from './sentry';
initSentry();

import express from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import type { Server } from 'http';

import { config } from './config';
import { devBasicAuth } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { apiLimiter, mutationLimiter } from './middleware/rate-limiter';
import { httpLogger } from './middleware/http-logger';
import apiRouter from './routes';
import prisma from './prisma';
import logger from './logger';
import { connectRedis, disconnectRedis } from './redis';
import { autoArchiveExpired } from './services/tournament.service';

const app = express();

// ── Security ──
const isProd = config.NODE_ENV === 'production';
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  // HSTS only in production (behind SSL). On dev it forces https:// which breaks access.
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
  // Disable headers that cause warnings on plain HTTP (non-HTTPS)
  crossOriginOpenerPolicy: isProd ? { policy: 'same-origin' } : false,
  crossOriginResourcePolicy: isProd ? { policy: 'same-origin' } : false,
  originAgentCluster: isProd,
}));

// ── Request logging ──
app.use(httpLogger);

// ── Performance ──
app.use(compression());

// ── CORS ──
const corsOrigin =
  config.NODE_ENV === 'production' && config.DOMAIN
    ? [`https://${config.DOMAIN}`, `https://www.${config.DOMAIN}`]
    : '*';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// ── Rate limiting ──
app.use('/api/', apiLimiter);
app.use('/api/', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return mutationLimiter(req, res, next);
  }
  next();
});

// ── Basic Auth for dev ──
if (config.DEV_AUTH === 'true') {
  app.use(devBasicAuth);
  logger.info({ user: config.DEV_USER }, 'Basic Auth enabled');
}

// ── API routes ──
app.use('/api', apiRouter);

// ── Serve uploaded files ──
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));

// ── Serve static frontend (production) ──
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));

// ── SPA fallback ──
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Error handler (must be last) ──
app.use(errorHandler);

// ── Auto-archive scheduler ──
const AUTO_ARCHIVE_INTERVAL_MS = 60_000;
let archiveTimer: ReturnType<typeof setInterval> | null = null;

function startAutoArchive(): void {
  autoArchiveExpired().catch((err) =>
    logger.error({ err }, 'auto-archive initial run failed'),
  );

  archiveTimer = setInterval(() => {
    autoArchiveExpired().catch((err) =>
      logger.error({ err }, 'auto-archive tick failed'),
    );
  }, AUTO_ARCHIVE_INTERVAL_MS);

  logger.info({ intervalSec: AUTO_ARCHIVE_INTERVAL_MS / 1000 }, 'Auto-archive scheduler started');
}

// ── Start ──
let server: Server;

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.fatal({ err: error }, 'Database connection failed');
    process.exit(1);
  }

  await connectRedis();

  server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Server started');
  });

  startAutoArchive();
}

// ── Graceful shutdown ──
const SHUTDOWN_TIMEOUT_MS = 15_000;

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown initiated');

  if (archiveTimer) {
    clearInterval(archiveTimer);
    archiveTimer = null;
  }

  const forceExit = setTimeout(() => {
    logger.warn('Forced shutdown — timeout exceeded');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed (all connections drained)');
        resolve();
      });
    });
  }

  await disconnectRedis();
  await prisma.$disconnect();
  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
