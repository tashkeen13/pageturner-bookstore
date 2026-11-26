import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from './errorMiddleware.js';

/**
 * Checks the Bearer token and loads the current user from MongoDB.
 */
export async function protect(req, _res, next) {
  try {
    const authorization = req.get('authorization');
    const match = typeof authorization === 'string'
      ? authorization.match(/^Bearer ([^\s]+)$/i)
      : null;
    const token = match?.[1];

    if (!token) {
      throw new ApiError(401, 'Sign in to access this resource.');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload !== 'object' || !payload.sub) {
      throw new ApiError(401, 'Your sign-in token is invalid.');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, 'This account no longer exists.');
    }
    if (user.isBlocked) {
      throw new ApiError(403, 'This account has been blocked. Contact the store administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Your sign-in token is invalid or has expired.'));
    }
    return next(error);
  }
}

/**
 * Must be used after protect. Only users with the admin role can continue.
 */
export function adminOnly(req, _res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Sign in to access this resource.'));
  }
  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Administrator access is required.'));
  }
  return next();
}
