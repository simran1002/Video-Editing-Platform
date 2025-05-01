"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Async handler to wrap route handlers and catch errors
 * @param fn The async route handler function
 * @returns A function that catches any errors and passes them to the next middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.default = asyncHandler;
