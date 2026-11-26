import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'An order item must reference a book.']
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required.'],
      min: [1, 'Item quantity must be at least 1.'],
      validate: {
        validator: Number.isInteger,
        message: 'Item quantity must be a whole number.'
      }
    },
    price: {
      type: Number,
      required: [true, 'Item price is required.'],
      min: [0, 'Item price cannot be negative.']
    }
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'Shipping name is required.'], trim: true, maxlength: 100 },
    address: { type: String, required: [true, 'Shipping address is required.'], trim: true, maxlength: 200 },
    city: { type: String, required: [true, 'Shipping city is required.'], trim: true, maxlength: 100 },
    postalCode: { type: String, required: [true, 'Shipping postal code is required.'], trim: true, maxlength: 30 },
    country: { type: String, required: [true, 'Shipping country is required.'], trim: true, maxlength: 100 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An order must belong to a user.']
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: items => items.length > 0,
        message: 'An order must have at least one item.'
      }
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required.']
    },
    totalPrice: {
      type: Number,
      required: [true, 'Order total is required.'],
      min: [0, 'Order total cannot be negative.']
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'cash_on_delivery'],
      default: 'stripe'
    },
    status: {
      type: String,
      enum: ['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'processing'
    }
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
