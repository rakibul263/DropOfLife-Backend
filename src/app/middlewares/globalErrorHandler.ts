import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
): void => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errorMessages = [{ path: '', message }];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorMessages = err.issues.map((issue) => ({
      path: issue.path[issue.path.length - 1]?.toString() || '',
      message: issue.message,
    }));
  } else if (err?.errors) {
    errorMessages = err.errors;
  }

  // Structured Error Logging
  logger.error(
    `[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`,
    {
      ip: req.ip || req.socket.remoteAddress,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    }
  );

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'Something went wrong on the server' : message,
    errorMessages,
    stack: isProduction ? undefined : err.stack,
  });
};

export const errorHandler = globalErrorHandler;

