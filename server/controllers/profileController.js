import User from '../models/User.js';
import { ApiError } from '../middleware/errorMiddleware.js';

function publicProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    savedAddresses: user.savedAddresses || []
  };
}

export async function getProfile(req, res) {
  res.json({ success: true, user: publicProfile(req.user) });
}

export async function updateProfile(req, res) {
  const { name, email, savedAddresses } = req.body || {};
  const errors = [];
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    errors.push('Name must be between 2 and 80 characters.');
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('Enter a valid email address.');
  }
  if (savedAddresses !== undefined) {
    if (!Array.isArray(savedAddresses) || savedAddresses.length > 10) errors.push('Save no more than 10 addresses.');
    else savedAddresses.forEach((address, index) => {
      const fields = { label: 40, fullName: 100, address: 200, city: 100, postalCode: 30, country: 100 };
      for (const [field, max] of Object.entries(fields)) {
        const optional = field === 'label';
        if ((!optional || address?.[field] !== undefined) && (typeof address?.[field] !== 'string' || (!optional && !address[field].trim()) || address[field].trim().length > max)) {
          errors.push(`Address ${index + 1}: ${field} must be text${optional ? '' : ' and is required'} (max ${max} characters).`);
        }
      }
    });
  }
  if (errors.length) throw new ApiError(400, 'Please check your profile details.', errors);

  req.user.name = name.trim();
  req.user.email = email.trim().toLowerCase();
  if (savedAddresses !== undefined) req.user.savedAddresses = savedAddresses;
  await req.user.save();
  res.json({ success: true, user: publicProfile(req.user) });
}

export async function changePassword(req, res) {
  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new ApiError(404, 'Account not found.');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
}
