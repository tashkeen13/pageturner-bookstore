import { ApiError } from './errorMiddleware.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(req, _res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(new ApiError(400, 'Request body must be a JSON object.'));
  }
  const errors = [];
  if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 80) {
    errors.push('Name must be between 2 and 80 characters.');
  }
  if (typeof body.email !== 'string' || body.email.trim().length > 254 || !emailPattern.test(body.email.trim())) {
    errors.push('Enter a valid email address (maximum 254 characters).');
  }
  if (typeof body.message !== 'string' || body.message.trim().length < 10 || body.message.trim().length > 5000) {
    errors.push('Message must be between 10 and 5000 characters.');
  }
  if (errors.length) return next(new ApiError(400, 'Please check the contact form.', errors));
  return next();
}
