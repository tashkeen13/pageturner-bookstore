import Book from '../models/Book.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import mongoose from 'mongoose';
import { ApiError } from '../middleware/errorMiddleware.js';

const LOW_STOCK_LIMIT = 10;

export async function getDashboard(_req, res) {
  const chartStart = new Date();
  chartStart.setDate(1);
  chartStart.setHours(0, 0, 0, 0);
  chartStart.setMonth(chartStart.getMonth() - 5);
  const [sales, totalOrders, totalUsers, lowStockCount, recentOrders, lowStockBooks, monthlySales] = await Promise.all([
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.countDocuments(),
    User.countDocuments(),
    Book.countDocuments({ stock: { $lte: LOW_STOCK_LIMIT } }),
    Order.find()
      .populate('user', 'name email')
      .populate('items.book', 'title author coverImage')
      .sort({ createdAt: -1 })
      .limit(8),
    Book.find({ stock: { $lte: LOW_STOCK_LIMIT } })
      .select('title author stock coverImage')
      .sort({ stock: 1, title: 1 })
      .limit(10),
    Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: chartStart } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: '$totalPrice' }
      } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  const salesByMonth = new Map(monthlySales.map(item => [`${item._id.year}-${item._id.month}`, item.total]));
  const salesHistory = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(chartStart);
    date.setMonth(chartStart.getMonth() + index);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    return { label: new Intl.DateTimeFormat('en', { month: 'short' }).format(date), sales: salesByMonth.get(key) || 0 };
  });

  res.json({
    success: true,
    stats: {
      totalSales: sales[0]?.total || 0,
      totalOrders,
      totalUsers,
      lowStockCount,
      lowStockLimit: LOW_STOCK_LIMIT
    },
    recentOrders,
    lowStockBooks,
    salesHistory
  });
}

function readPageValue(value, fallback, max, field) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new ApiError(400, `${field} must be a whole number.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) throw new ApiError(400, `${field} must be between 1 and ${max}.`);
  return parsed;
}

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listAdminUsers(req, res) {
  const page = readPageValue(req.query.page, 1, 100000, 'page');
  const limit = readPageValue(req.query.limit, 20, 100, 'limit');
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const filter = search ? { $or: [
    { name: { $regex: escapeRegex(search), $options: 'i' } },
    { email: { $regex: escapeRegex(search), $options: 'i' } }
  ] } : {};
  const [totalUsers, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).select('name email role isBlocked createdAt').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
  ]);
  res.json({ success: true, users, pagination: { page, limit, totalUsers, totalPages: Math.ceil(totalUsers / limit) } });
}

export async function updateAdminUser(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'User ID is not valid.');
  const { role, isBlocked } = req.body || {};
  if (role === undefined && isBlocked === undefined) throw new ApiError(400, 'Provide a role or blocked status to update.');
  if (role !== undefined && !['user', 'admin'].includes(role)) throw new ApiError(400, 'Role must be user or admin.');
  if (isBlocked !== undefined && typeof isBlocked !== 'boolean') throw new ApiError(400, 'isBlocked must be true or false.');
  if (id === req.user.id && role === 'user') throw new ApiError(400, 'You cannot demote your own administrator account.');
  if (id === req.user.id && isBlocked === true) throw new ApiError(400, 'You cannot block your own administrator account.');
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (role !== undefined) user.role = role;
  if (isBlocked !== undefined) user.isBlocked = isBlocked;
  await user.save();
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, isBlocked: user.isBlocked, createdAt: user.createdAt } });
}

export async function deleteAdminUser(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'User ID is not valid.');
  if (id === req.user.id) throw new ApiError(400, 'You cannot delete your own administrator account.');
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, message: 'User deleted.' });
}

export async function listAdminReviews(req, res) {
  const page = readPageValue(req.query.page, 1, 100000, 'page');
  const limit = readPageValue(req.query.limit, 20, 100, 'limit');
  const [totalReviews, reviews] = await Promise.all([
    Review.countDocuments(),
    Review.find().populate('book', 'title').populate('user', 'name email').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
  ]);
  res.json({ success: true, reviews, pagination: { page, limit, totalReviews, totalPages: Math.ceil(totalReviews / limit) } });
}

export async function deleteAdminReview(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Review ID is not valid.');
  const session = await mongoose.startSession();
  let removed;
  try {
    await session.withTransaction(async () => {
      removed = await Review.findByIdAndDelete(id, { session });
      if (!removed) throw new ApiError(404, 'Review not found.');
      const [stats] = await Review.aggregate([
        { $match: { book: removed.book } },
        { $group: { _id: '$book', count: { $sum: 1 }, average: { $avg: '$rating' } } }
      ]).session(session);
      await Book.updateOne({ _id: removed.book }, { $set: {
        numReviews: stats?.count || 0,
        averageRating: stats ? Math.round(stats.average * 100) / 100 : 0
      } }, { session });
    });
  } finally {
    await session.endSession();
  }
  res.json({ success: true, message: 'Review deleted and book rating updated.' });
}
