import { ErrorRequestHandler } from 'express';

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
): void => {
  console.error('Unhandled API Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages: err.errors || [{ path: '', message }],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export const errorHandler = globalErrorHandler;
