import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Filter out high-frequency healthchecks from verbose logs if desired
    if (originalUrl === '/api/v1/health' || originalUrl === '/health') {
      return;
    }

    const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms [${ip || req.socket.remoteAddress}]`;

    if (statusCode >= 500) {
      logger.error(message);
    } else if (statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
};
