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
import apiRouter from './routes';
import prisma from './prisma';
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
  console.log(`[DEV] Basic Auth enabled (user: ${config.DEV_USER})`);
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
    console.error('[auto-archive] initial run error:', err),
  );

  archiveTimer = setInterval(() => {
    autoArchiveExpired().catch((err) =>
      console.error('[auto-archive] error:', err),
    );
  }, AUTO_ARCHIVE_INTERVAL_MS);

  console.log(`[auto-archive] Scheduler started (every ${AUTO_ARCHIVE_INTERVAL_MS / 1000}s)`);
}

// ── Start ──
let server: Server;

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[DB] Connected');
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    process.exit(1);
  }

  server = app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT} [${config.NODE_ENV}]`);
  });

  startAutoArchive();
}

// ── Graceful shutdown ──
async function shutdown(signal: string): Promise<void> {
  console.log(`[SHUTDOWN] ${signal} received`);

  if (archiveTimer) {
    clearInterval(archiveTimer);
    archiveTimer = null;
    console.log('[SHUTDOWN] Auto-archive scheduler stopped');
  }

  if (server) {
    server.close(() => {
      console.log('[SHUTDOWN] HTTP server closed');
    });
  }

  await prisma.$disconnect();
  console.log('[SHUTDOWN] DB disconnected');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
