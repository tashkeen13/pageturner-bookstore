import { ApiError } from './errorMiddleware.js';

export function validatePasswordChange(req, _res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(new ApiError(400, 'Request body must be a JSON object.'));
  }

  const errors = [];
  if (typeof body.currentPassword !== 'string' || !body.currentPassword) {
    errors.push('Current password is required.');
  }
  if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  } else if (Buffer.byteLength(body.newPassword, 'utf8') > 72) {
    errors.push('New password cannot be longer than 72 bytes.');
  }
  if (typeof body.confirmPassword !== 'string' || body.confirmPassword !== body.newPassword) {
    errors.push('Password confirmation must match the new password.');
  }

  if (errors.length) {
    return next(new ApiError(400, 'Please check the password information.', errors));
  }
  return next();
}
