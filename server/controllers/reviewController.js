import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Review from '../models/Review.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Lists public reviews for a book, newest first, with bounded pagination.
 */
export async function listReviews(req, res) {
  const { bookId } = req.params;
  if (!mongoose.isValidObjectId(bookId)) {
    throw new ApiError(400, 'Book ID is not a valid MongoDB ObjectId.');
  }
  if (!(await Book.exists({ _id: bookId }))) {
    throw new ApiError(404, 'Book not found.');
  }

  const readPositiveInteger = (value, fallback, maximum, name) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      throw new ApiError(400, `${name} must be a whole number.`);
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
      throw new ApiError(400, `${name} must be between 1 and ${maximum}.`);
    }
    return parsed;
  };
  const page = readPositiveInteger(req.query.page, 1, 100000, 'page');
  const limit = readPositiveInteger(req.query.limit, 10, 50, 'limit');

  const filter = { book: bookId };
  const totalReviews = await Review.countDocuments(filter);
  const totalPages = Math.ceil(totalReviews / limit);
  const reviews = page > totalPages ? [] : await Review.find(filter)
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    success: true,
    count: reviews.length,
    pagination: { page, limit, totalReviews, totalPages },
    reviews
  });
}

/**
 * Adds one review per user and book, then updates the book rating atomically.
 */
export async function createReview(req, res) {
  const { bookId } = req.params;
  const { rating, comment } = req.body || {};

  if (!mongoose.isValidObjectId(bookId)) {
    throw new ApiError(400, 'Book ID is not a valid MongoDB ObjectId.');
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'rating must be a whole number from 1 to 5.');
  }
  if (typeof comment !== 'string' || comment.trim().length < 2 || comment.trim().length > 2000) {
    throw new ApiError(400, 'comment must be between 2 and 2000 characters.');
  }
  if (!(await Book.exists({ _id: bookId }))) {
    throw new ApiError(404, 'Book not found.');
  }

  const session = await mongoose.startSession();
  let review;
  let updatedBook;

  try {
    await session.withTransaction(async () => {
      [review] = await Review.create([{
        book: bookId,
        user: req.user.id,
        rating,
        comment: comment.trim()
      }], { session });

      updatedBook = await refreshBookRating(bookId, session);
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'You have already reviewed this book.');
    }
    throw error;
  } finally {
    await session.endSession();
  }

  await review.populate('user', 'name');

  res.status(201).json({
    success: true,
    message: 'Review added.',
    review,
    averageRating: updatedBook.averageRating,
    numReviews: updatedBook.numReviews
  });
}

function validateReviewInput(rating, comment) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError(400, 'rating must be a whole number from 1 to 5.');
  if (typeof comment !== 'string' || comment.trim().length < 2 || comment.trim().length > 2000) throw new ApiError(400, 'comment must be between 2 and 2000 characters.');
}

async function refreshBookRating(bookId, session) {
  const [stats] = await Review.aggregate([
    { $match: { book: bookId } },
    { $group: { _id: '$book', count: { $sum: 1 }, average: { $avg: '$rating' } } }
  ]).session(session);
  const book = await Book.findByIdAndUpdate(bookId, { $set: {
    numReviews: stats?.count || 0,
    averageRating: stats ? Math.round(stats.average * 100) / 100 : 0
  } }, { new: true, session });
  if (!book) throw new ApiError(404, 'Book not found.');
  return book;
}

export async function updateOwnReview(req, res) {
  const { bookId, reviewId } = req.params;
  if (!mongoose.isValidObjectId(bookId) || !mongoose.isValidObjectId(reviewId)) throw new ApiError(404, 'Review not found.');
  const { rating, comment } = req.body || {};
  validateReviewInput(rating, comment);
  const session = await mongoose.startSession();
  let review;
  let book;
  try {
    await session.withTransaction(async () => {
      review = await Review.findOneAndUpdate(
        { _id: reviewId, book: bookId, user: req.user.id },
        { $set: { rating, comment: comment.trim() } },
        { new: true, runValidators: true, session }
      ).populate('user', 'name');
      if (!review) throw new ApiError(404, 'Review not found.');
      book = await refreshBookRating(review.book, session);
    });
  } finally { await session.endSession(); }
  res.json({ success: true, message: 'Review updated.', review, averageRating: book.averageRating, numReviews: book.numReviews });
}

export async function deleteOwnReview(req, res) {
  const { bookId, reviewId } = req.params;
  if (!mongoose.isValidObjectId(bookId) || !mongoose.isValidObjectId(reviewId)) throw new ApiError(404, 'Review not found.');
  const session = await mongoose.startSession();
  let book;
  try {
    await session.withTransaction(async () => {
      const review = await Review.findOneAndDelete({ _id: reviewId, book: bookId, user: req.user.id }, { session });
      if (!review) throw new ApiError(404, 'Review not found.');
      book = await refreshBookRating(review.book, session);
    });
  } finally { await session.endSession(); }
  res.json({ success: true, message: 'Review deleted.', averageRating: book.averageRating, numReviews: book.numReviews });
}
