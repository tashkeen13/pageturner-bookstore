import { ApiError } from './errorMiddleware.js';

/**
 * Prevents arrays, null, and primitive JSON values from reaching book writes.
 * The Book model handles validation of each individual field.
 */
export function validateBookBody(req, _res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next(new ApiError(400, 'Request body must be a JSON object.'));
  }
  return next();
}
