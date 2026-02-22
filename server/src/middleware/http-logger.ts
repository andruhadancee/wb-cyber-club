import crypto from 'crypto';
import pinoHttp from 'pino-http';
import logger from '../logger';

let counter = 0;

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    const existing = req.headers['x-request-id'];
    if (existing) return existing as string;
    return `${Date.now().toString(36)}-${(++counter).toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
  },
  autoLogging: {
    ignore: (req) => {
      const url = (req as any).originalUrl ?? req.url ?? '';
      return url === '/health' || url.startsWith('/uploads');
    },
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${(req as any).originalUrl ?? req.url} ${res.statusCode}`,
  customErrorMessage: (req, _res, err) =>
    `${req.method} ${(req as any).originalUrl ?? req.url} ${err.message}`,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
