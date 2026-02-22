import * as Sentry from '@sentry/node';
import logger from './logger';

const DSN = process.env.SENTRY_DSN;

export function initSentry(): void {
  if (!DSN) {
    logger.debug('SENTRY_DSN not set — Sentry disabled');
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });

  logger.info('Sentry initialized');
}

export { Sentry };
