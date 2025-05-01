"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(status, message, error) {
        super(message);
        this.status = status;
        this.error = error;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.ApiError = ApiError;
const errorHandler = (err, req, res, next) => {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err.message || 'Something went wrong';
    const error = err instanceof ApiError && err.error ? err.error : undefined;
    console.error(`[ERROR] ${status} - ${message}`, error || '');
    res.status(status).json({
        error: message,
        details: process.env.NODE_ENV === 'production' ? undefined : error
    });
};
exports.errorHandler = errorHandler;
