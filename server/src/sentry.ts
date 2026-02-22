import * as Sentry from '@sentry/node';
import { config } from './config';
import logger from './logger';

export function initSentry(): void {
  if (!config.SENTRY_DSN) {
    logger.debug('SENTRY_DSN not set — Sentry disabled');
    return;
  }

  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.2 : 1.0,
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
