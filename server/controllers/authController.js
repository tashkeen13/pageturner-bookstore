import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../middleware/errorMiddleware.js';
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from '../services/passwordResetEmail.js';

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing. Add it to server/.env.');
  }

  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: userId.toString(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    wishlist: user.wishlist
  };
}

/**
 * Creates an account. The role is always the model default; clients cannot
 * register themselves as administrators by adding a role to the request.
 */
export async function register(req, res) {
  const { name, email, password } = req.body;
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password
  });

  res.status(201).json({
    success: true,
    message: 'Your account was created. You can now sign in.',
    user: publicUser(user)
  });
}

/**
 * Verifies the password and returns a signed JWT for later requests.
 */
export async function login(req, res) {
  const email = req.body.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Email or password is incorrect.');
  }
  if (user.isBlocked) {
    throw new ApiError(403, 'This account has been blocked. Contact the store administrator.');
  }

  res.json({
    success: true,
    message: 'You are signed in.',
    token: createToken(user.id),
    user: publicUser(user)
  });
}

/** Always responds generically so callers cannot discover registered emails. */
export async function requestPasswordReset(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !isPasswordResetEmailConfigured()) {
    throw new ApiError(503, 'Password reset email is temporarily unavailable. Please try again later.');
  }

  const email = req.body.email.trim().toLowerCase();
  const user = await User.findOne({ email });
  let resetUrl;

  if (user) {
    const token = randomBytes(32).toString('hex');
    user.passwordResetToken = createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    const configuredClientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:5173';
    const clientUrl = !isProduction && req.get('origin')
      ? req.get('origin')
      : configuredClientUrl;
    resetUrl = `${clientUrl.replace(/\/$/, '')}/reset-password/${token}`;

    if (isPasswordResetEmailConfigured()) {
      try {
        await sendPasswordResetEmail({ email: user.email, name: user.name, resetUrl });
      } catch {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        console.error('Password reset email delivery failed. Check the configured email service.');
      }
    }
  }

  res.json({
    success: true,
    message: 'If an account exists for that email, password reset instructions have been sent.',
    ...(user && !isProduction && !isPasswordResetEmailConfigured() ? { resetUrl } : {})
  });
}

export async function resetPassword(req, res) {
  const hashedToken = createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw new ApiError(400, 'This password reset link is invalid or has expired. Request a new one.');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Your password has been reset. You can now sign in.' });
}
