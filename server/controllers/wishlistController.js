import mongoose from 'mongoose';
import Book from '../models/Book.js';
import User from '../models/User.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Atomically adds a book to or removes it from the signed-in user's wishlist.
 */
export async function toggleWishlist(req, res) {
  const { bookId } = req.params;
  if (!mongoose.isValidObjectId(bookId)) {
    throw new ApiError(400, 'Book ID is not a valid MongoDB ObjectId.');
  }
  if (!(await Book.exists({ _id: bookId }))) {
    throw new ApiError(404, 'Book not found.');
  }

  const wishlistUser = await User.findByIdAndUpdate(
    req.user.id,
    [{
      $set: {
        wishlist: {
          $cond: [
            { $in: [new mongoose.Types.ObjectId(bookId), '$wishlist'] },
            {
              $filter: {
                input: '$wishlist',
                as: 'wishlistBook',
                cond: { $ne: ['$$wishlistBook', new mongoose.Types.ObjectId(bookId)] }
              }
            },
            { $concatArrays: ['$wishlist', [new mongoose.Types.ObjectId(bookId)]] }
          ]
        }
      }
    }],
    { new: true }
  ).populate('wishlist');

  if (!wishlistUser) throw new ApiError(404, 'User account not found.');

  const inWishlist = wishlistUser.wishlist.some(book => book.id === bookId);
  res.json({
    success: true,
    message: inWishlist ? 'Book added to wishlist.' : 'Book removed from wishlist.',
    inWishlist,
    wishlist: wishlistUser.wishlist
  });
}

/**
 * Lists the signed-in user's saved books, omitting books that have been deleted.
 */
export async function getWishlist(req, res) {
  const user = await User.findById(req.user.id).populate('wishlist');
  if (!user) throw new ApiError(404, 'User account not found.');

  res.json({
    success: true,
    count: user.wishlist.length,
    wishlist: user.wishlist
  });
}
