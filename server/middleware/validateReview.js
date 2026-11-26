import { ApiError } from './errorMiddleware.js';

export function validateReviewBody(req, _res, next) {
  const { rating, comment } = req.body || {};
  const errors = [];

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('rating must be a whole number from 1 to 5.');
  }
  if (typeof comment !== 'string' || comment.trim().length < 2 || comment.trim().length > 2000) {
    errors.push('comment must be between 2 and 2000 characters.');
  }

  if (errors.length) {
    return next(new ApiError(400, 'Please check the review information.', errors));
  }
  return next();
}
