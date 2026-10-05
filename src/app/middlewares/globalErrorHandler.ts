import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

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

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export const errorHandler = globalErrorHandler;
