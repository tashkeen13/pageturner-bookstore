import ContactMessage from '../models/ContactMessage.js';
import { ApiError } from '../middleware/errorMiddleware.js';

function readPositiveInteger(value, fallback, maximum, field) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new ApiError(400, `${field} must be a whole number.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) throw new ApiError(400, `${field} must be between 1 and ${maximum}.`);
  return parsed;
}

export async function createContactMessage(req, res) {
  const contactMessage = await ContactMessage.create({
    name: req.body.name.trim(),
    email: req.body.email.trim().toLowerCase(),
    message: req.body.message.trim()
  });
  res.status(201).json({ success: true, message: 'Your message was sent. The PageTurner team will be in touch.', contactMessage: { id: contactMessage.id, createdAt: contactMessage.createdAt } });
}

export async function listContactMessages(req, res) {
  const page = readPositiveInteger(req.query.page, 1, 100000, 'page');
  const limit = readPositiveInteger(req.query.limit, 20, 100, 'limit');
  const totalMessages = await ContactMessage.countDocuments();
  const totalPages = Math.ceil(totalMessages / limit);
  const messages = page > totalPages ? [] : await ContactMessage.find()
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  res.json({ success: true, messages, pagination: { page, limit, totalMessages, totalPages } });
}
