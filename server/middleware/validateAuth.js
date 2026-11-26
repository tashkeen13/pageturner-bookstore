import { ApiError } from './errorMiddleware.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields) {
  return (req, _res, next) => {
    const errors = [];
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return next(new ApiError(400, 'Request body must be a JSON object.'));
    }

    for (const field of fields) {
      if (typeof body[field] !== 'string' || !body[field].trim()) {
        errors.push(`${field} is required and must be text.`);
      }
    }

    if (typeof body.email === 'string' && !emailPattern.test(body.email.trim())) {
      errors.push('Enter a valid email address.');
    }
    if (typeof body.email === 'string' && body.email.trim().length > 254) {
      errors.push('Email cannot be longer than 254 characters.');
    }

    if (typeof body.password === 'string') {
      if (body.password.length < 8) errors.push('Password must be at least 8 characters long.');
      if (Buffer.byteLength(body.password, 'utf8') > 72) {
        errors.push('Password cannot be longer than 72 bytes.');
      }
    }

    if (typeof body.name === 'string') {
      if (body.name.trim().length < 2) errors.push('Name must be at least 2 characters long.');
      if (body.name.trim().length > 80) errors.push('Name cannot be longer than 80 characters.');
    }

    if (errors.length) {
      return next(new ApiError(400, 'Please check the submitted information.', errors));
    }

    return next();
  };
}

export const validateRegister = validate(['name', 'email', 'password']);
export const validateLogin = validate(['email', 'password']);

export const validatePasswordResetRequest = validate(['email']);

export function validatePasswordReset(req, _res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(new ApiError(400, 'Request body must be a JSON object.'));
  }
  const errors = [];
  if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/i.test(body.token)) {
    errors.push('The password reset link is invalid or has expired.');
  }
  if (typeof body.password !== 'string' || body.password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (Buffer.byteLength(body.password, 'utf8') > 72) {
    errors.push('Password cannot be longer than 72 bytes.');
  }
  if (errors.length) return next(new ApiError(400, 'Please check the submitted information.', errors));
  return next();
}
