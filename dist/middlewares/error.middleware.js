"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.ApiError = void 0;
/**
 * Custom API error class
 */
class ApiError extends Error {
    constructor(status, message, error) {
        super(message);
        this.status = status;
        this.error = error;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.ApiError = ApiError;
/**
 * Not found error handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Resource not found - ${req.originalUrl}`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err.message || 'Something went wrong';
    const error = err instanceof ApiError && err.error ? err.error : undefined;
    console.error(`[ERROR] ${status} - ${message}`, error || '');
    res.status(status).json({
        status,
        message,
        error: process.env.NODE_ENV === 'production' ? undefined : error
    });
};
exports.errorHandler = errorHandler;
