import mongoose from 'mongoose';

const checkoutItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const checkoutAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkoutSessionId: { type: String, unique: true, sparse: true },
    items: { type: [checkoutItemSchema], required: true },
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    amountTotal: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
  },
  { timestamps: true }
);

const CheckoutAttempt = mongoose.model('CheckoutAttempt', checkoutAttemptSchema);

export default CheckoutAttempt;
