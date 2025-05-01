import { Request, Response, NextFunction } from 'express';

/**
 * Async handler to wrap route handlers and catch errors
 * @param fn The async route handler function
 * @returns A function that catches any errors and passes them to the next middleware
 */
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
