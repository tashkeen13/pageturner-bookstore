import mongoose from 'mongoose';
import Book from '../models/Book.js';
import { ApiError } from '../middleware/errorMiddleware.js';

const sortOptions = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1, title: 1, _id: 1 },
  price_desc: { price: -1, title: 1, _id: 1 },
  rating_desc: { averageRating: -1, numReviews: -1 },
  title_asc: { title: 1, _id: 1 }
};

const sortAliases = {
  'low-to-high': 'price_asc',
  low_to_high: 'price_asc',
  price_low_to_high: 'price_asc',
  'high-to-low': 'price_desc',
  high_to_low: 'price_desc',
  price_high_to_low: 'price_desc'
};

function readNumber(value, name, { min, max, integer = false } = {}) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(400, `${name} must be a number.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
    throw new ApiError(400, `${name} must be ${integer ? 'a whole number ' : ''}between ${min} and ${max}.`);
  }
  return parsed;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Lists books with safe search, filter, sorting, and bounded pagination.
 */
export async function listBooks(req, res) {
  const page = readNumber(req.query.page, 'page', { min: 1, max: 1_000_000, integer: true }) ?? 1;
  const limit = readNumber(req.query.limit, 'limit', { min: 1, max: 50, integer: true }) ?? 12;
  const minPrice = readNumber(req.query.minPrice, 'minPrice', { min: 0, max: Number.MAX_SAFE_INTEGER });
  const maxPrice = readNumber(req.query.maxPrice, 'maxPrice', { min: 0, max: Number.MAX_SAFE_INTEGER });
  const minRating = readNumber(req.query.minRating, 'minRating', { min: 0, max: 5 });
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const genre = typeof req.query.genre === 'string' ? req.query.genre.trim() : '';
  const requestedSort = req.query.sort === undefined ? 'newest' : req.query.sort;
  const sortBy = typeof requestedSort === 'string'
    ? sortAliases[requestedSort] || requestedSort
    : requestedSort;

  if (req.query.search !== undefined && typeof req.query.search !== 'string') {
    throw new ApiError(400, 'search must be a text value.');
  }
  if (req.query.genre !== undefined && (typeof req.query.genre !== 'string' || !genre)) {
    throw new ApiError(400, 'genre must be a non-empty text value.');
  }
  if (search.length > 100) throw new ApiError(400, 'search cannot be longer than 100 characters.');
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ApiError(400, 'minPrice cannot be greater than maxPrice.');
  }
  if (typeof sortBy !== 'string' || !Object.hasOwn(sortOptions, sortBy)) {
    throw new ApiError(400, `sort must be one of: ${Object.keys(sortOptions).join(', ')}.`);
  }

  const filter = {};
  if (search) {
    const safeSearch = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: safeSearch }, { author: safeSearch }, { isbn: safeSearch }];
  }
  if (genre) filter.genre = new RegExp(`^${escapeRegex(genre)}$`, 'i');
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (minRating !== undefined) filter.averageRating = { $gte: minRating };

  const totalBooks = await Book.countDocuments(filter);
  const totalPages = Math.ceil(totalBooks / limit);
  let books = [];
  if (page <= totalPages) {
    let query = Book.find(filter)
      .sort(sortOptions[sortBy])
      .skip((page - 1) * limit)
      .limit(limit);
    if (sortBy === 'title_asc') {
      query = query.collation({ locale: 'en', strength: 2, numericOrdering: true });
    }
    books = await query;
  }

  res.json({
    success: true,
    count: books.length,
    pagination: {
      page,
      limit,
      totalBooks,
      totalPages
    },
    books
  });
}

/**
 * Returns the unique genres currently represented in the catalog.
 */
export async function listGenres(_req, res) {
  const values = await Book.distinct('genre');
  const genresByKey = new Map();
  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const genre = value.trim();
    const key = genre.toLocaleLowerCase('en');
    if (!genresByKey.has(key)) genresByKey.set(key, genre);
  }

  const genres = [...genresByKey.values()].sort((a, b) => a.localeCompare(b));
  res.json({ success: true, count: genres.length, genres });
}

/**
 * Gets one book by its MongoDB ObjectId.
 */
export async function getBook(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Book ID is not a valid MongoDB ObjectId.');
  }

  const book = await Book.findById(req.params.id);
  if (!book) throw new ApiError(404, 'Book not found.');

  res.json({ success: true, book });
}

/**
 * Adds a book. This route is restricted to administrators.
 */
export async function createBook(req, res) {
  const allowedFields = [
    'title', 'author', 'description', 'price', 'stock', 'genre', 'language',
    'publisher', 'isbn', 'pages', 'coverImage'
  ];
  const input = Object.fromEntries(
    Object.entries(req.body).filter(([field]) => allowedFields.includes(field))
  );
  const book = await Book.create(input);
  res.status(201).json({ success: true, book });
}

/**
 * Updates only fields that belong to a book; role and other fields are ignored.
 */
export async function updateBook(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Book ID is not a valid MongoDB ObjectId.');
  }

  const allowedFields = [
    'title', 'author', 'description', 'price', 'stock', 'genre', 'language',
    'publisher', 'isbn', 'pages', 'coverImage'
  ];
  const updates = Object.fromEntries(
    Object.entries(req.body || {}).filter(([field]) => allowedFields.includes(field))
  );
  if (!Object.keys(updates).length) {
    throw new ApiError(400, 'Provide at least one valid book field to update.');
  }

  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );
  if (!book) throw new ApiError(404, 'Book not found.');

  res.json({ success: true, book });
}

/**
 * Deletes a book by ID. Wishlist references are left as-is; a later wishlist
 * feature can decide whether to clean up or ignore books that no longer exist.
 */
export async function deleteBook(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Book ID is not a valid MongoDB ObjectId.');
  }

  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) throw new ApiError(404, 'Book not found.');

  res.json({ success: true, message: 'Book deleted.' });
}
