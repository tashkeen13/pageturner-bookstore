import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'A book is required for a review.']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A user is required for a review.']
    },
    rating: {
      type: Number,
      required: [true, 'A rating is required.'],
      min: [1, 'Rating must be between 1 and 5.'],
      max: [5, 'Rating must be between 1 and 5.'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number from 1 to 5.'
      }
    },
    comment: {
      type: String,
      required: [true, 'A comment is required.'],
      trim: true,
      minlength: [2, 'Comment must be at least 2 characters long.'],
      maxlength: [2000, 'Comment cannot be longer than 2000 characters.']
    }
  },
  { timestamps: true }
);

// The database index also protects against duplicate reviews from simultaneous requests.
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
