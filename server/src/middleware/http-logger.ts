import pinoHttp from 'pino-http';
import logger from '../logger';

export const httpLogger = pinoHttp({
  logger,
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
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
