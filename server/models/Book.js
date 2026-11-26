import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot be longer than 200 characters.']
    },
    author: {
      type: String,
      required: [true, 'Book author is required.'],
      trim: true,
      maxlength: [120, 'Author cannot be longer than 120 characters.']
    },
    description: {
      type: String,
      required: [true, 'Book description is required.'],
      trim: true,
      maxlength: [5000, 'Description cannot be longer than 5000 characters.']
    },
    price: {
      type: Number,
      required: [true, 'Book price is required.'],
      min: [0, 'Price cannot be negative.'],
      max: [999999.99, 'Price cannot be greater than 999999.99.'],
      validate: {
        validator: value => Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
        message: 'Price can have no more than two decimal places.'
      }
    },
    stock: {
      type: Number,
      required: [true, 'Book stock is required.'],
      min: [0, 'Stock cannot be negative.'],
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be a whole number.'
      }
    },
    genre: {
      type: String,
      required: [true, 'Book genre is required.'],
      trim: true,
      maxlength: [60, 'Genre cannot be longer than 60 characters.']
    },
    language: {
      type: String,
      required: [true, 'Book language is required.'],
      trim: true,
      maxlength: [60, 'Language cannot be longer than 60 characters.']
    },
    publisher: {
      type: String,
      required: [true, 'Book publisher is required.'],
      trim: true,
      maxlength: [120, 'Publisher cannot be longer than 120 characters.']
    },
    isbn: {
      type: String,
      required: [true, 'Book ISBN is required.'],
      unique: true,
      trim: true,
      maxlength: [20, 'ISBN cannot be longer than 20 characters.']
    },
    pages: {
      type: Number,
      required: [true, 'Book page count is required.'],
      min: [1, 'A book must have at least one page.'],
      validate: {
        validator: Number.isInteger,
        message: 'Page count must be a whole number.'
      }
    },
    coverImage: {
      type: String,
      required: [true, 'Book cover image URL is required.'],
      trim: true,
      maxlength: [2048, 'Cover image URL cannot be longer than 2048 characters.'],
      validate: {
        validator: value => {
          if (/^\/uploads\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(value)) return true;
          try { return new URL(value).protocol === 'https:'; } catch { return false; }
        },
        message: 'Cover image must be a valid HTTPS URL or an uploaded local image path.'
      }
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be lower than 0.'],
      max: [5, 'Rating cannot be higher than 5.']
    },
    numReviews: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative.'],
      validate: {
        validator: Number.isInteger,
        message: 'Review count must be a whole number.'
      }
    }
  },
  { timestamps: true }
);

bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ genre: 1 });

const Book = mongoose.model('Book', bookSchema);

export default Book;
