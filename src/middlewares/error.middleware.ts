import { Request, Response, NextFunction } from 'express';

/**
 * Error response interface
 */
export interface ErrorResponse {
  status: number;
  message: string;
  error?: any;
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  status: number;
  error?: any;

  constructor(status: number, message: string, error?: any) {
    super(message);
    this.status = status;
    this.error = error;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Global error handler
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err instanceof ApiError ? err.status : 500;
  const message = err.message || 'Something went wrong';
  const error = err instanceof ApiError && err.error ? err.error : undefined;

  console.error(`[ERROR] ${status} - ${message}`, error || '');

  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === 'production' ? undefined : error
  });
};
