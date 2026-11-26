import mongoose from 'mongoose';
import Stripe from 'stripe';
import Book from '../models/Book.js';
import CheckoutAttempt from '../models/CheckoutAttempt.js';
import Order from '../models/Order.js';
import { ApiError } from '../middleware/errorMiddleware.js';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new ApiError(503, 'Stripe is not configured. Add STRIPE_SECRET_KEY to server/.env.');
  }
  if (!secretKey.startsWith('sk_test_')) {
    throw new ApiError(503, 'PageTurner checkout only accepts a Stripe test-mode secret key.');
  }
  return new Stripe(secretKey);
}

function getClientUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function readOrdersPage(query) {
  const read = (value, fallback, maximum, name) => {
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
  return {
    page: read(query.page, 1, 1_000_000, 'page'),
    limit: read(query.limit, 20, 50, 'limit')
  };
}

export async function createCheckoutSession(req, res) {
  const { items, shippingAddress } = req.body;
  const quantitiesByBook = new Map();

  for (const item of items) {
    if (!mongoose.isValidObjectId(item.book)) {
      throw new ApiError(400, `Invalid book ID: ${item.book}.`);
    }
    const nextQuantity = (quantitiesByBook.get(item.book) || 0) + item.quantity;
    if (nextQuantity > 99) {
      throw new ApiError(400, 'A single title cannot exceed 99 copies per order.');
    }
    quantitiesByBook.set(item.book, nextQuantity);
  }

  const books = [];
  for (const [bookId, quantity] of quantitiesByBook) {
    const book = await Book.findById(bookId).select('title author price stock');
    if (!book) throw new ApiError(404, 'A book in your cart could not be found.');
    if (book.stock < quantity) throw new ApiError(409, `Not enough stock available for "${book.title}".`);
    books.push({ book, quantity });
  }

  const itemsForAttempt = books.map(({ book, quantity }) => ({
    book: book._id,
    quantity,
    price: book.price
  }));
  const amountTotal = itemsForAttempt.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  if (!Number.isSafeInteger(amountTotal) || amountTotal > 99_999_999) {
    throw new ApiError(400, 'The cart total is above the maximum supported checkout amount.');
  }
  const attempt = await CheckoutAttempt.create({
    user: req.user.id,
    items: itemsForAttempt,
    shippingAddress,
    amountTotal
  });

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: req.user.id,
      metadata: { checkoutAttemptId: attempt.id },
      line_items: books.map(({ book, quantity }) => ({
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(book.price * 100),
          product_data: {
            name: book.title,
            description: `by ${book.author}`,
            metadata: { bookId: book.id }
          }
        }
      })),
      success_url: `${getClientUrl()}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getClientUrl()}/checkout?canceled=1`
    });

    attempt.checkoutSessionId = checkoutSession.id;
    await attempt.save();
    res.status(201).json({ success: true, checkoutUrl: checkoutSession.url });
  } catch (error) {
    await CheckoutAttempt.findByIdAndDelete(attempt.id);
    throw error;
  }
}

/** Creates a COD order using current catalog prices and reserves stock atomically. */
export async function createCashOnDeliveryOrder(req, res) {
  const quantities = new Map();
  for (const item of req.body.items) {
    if (!mongoose.isValidObjectId(item.book)) throw new ApiError(400, 'A book ID in your bag is invalid.');
    const nextQuantity = (quantities.get(item.book) || 0) + item.quantity;
    if (nextQuantity > 99) throw new ApiError(400, 'A single title cannot exceed 99 copies per order.');
    quantities.set(item.book, nextQuantity);
  }
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      const items = [];
      let amountTotal = 0;
      for (const [bookId, quantity] of quantities) {
        const book = await Book.findOneAndUpdate(
          { _id: bookId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true, session }
        );
        if (!book) {
          const exists = await Book.exists({ _id: bookId }).session(session);
          if (!exists) throw new ApiError(404, 'A book in your bag could not be found.');
          throw new ApiError(409, 'There is not enough stock for one of the books in your bag.');
        }
        items.push({ book: book._id, quantity, price: book.price });
        amountTotal += Math.round(book.price * 100) * quantity;
      }
      if (!Number.isSafeInteger(amountTotal) || amountTotal > 99_999_999) throw new ApiError(400, 'The cart total is above the maximum supported checkout amount.');
      const totalPrice = amountTotal / 100;
      [order] = await Order.create([{
        user: req.user.id,
        items,
        shippingAddress: req.body.shippingAddress,
        totalPrice,
        isPaid: false,
        paymentMethod: 'cash_on_delivery'
      }], { session });
    });
  } finally {
    await session.endSession();
  }
  await order.populate('items.book', 'title author coverImage');
  res.status(201).json({ success: true, order });
}

export async function quoteCheckout(req, res) {
  const requested = req.body?.items;
  if (!Array.isArray(requested) || requested.length < 1 || requested.length > 50) throw new ApiError(400, 'Your bag must contain between 1 and 50 book entries.');
  const quantities = new Map();
  for (const item of requested) {
    if (!item || !mongoose.isValidObjectId(item.book) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new ApiError(400, 'A book or quantity in your bag is invalid.');
    }
    const nextQuantity = (quantities.get(item.book) || 0) + item.quantity;
    if (nextQuantity > 99) throw new ApiError(400, 'A single title cannot exceed 99 copies per order.');
    quantities.set(item.book, nextQuantity);
  }
  const books = await Book.find({ _id: { $in: [...quantities.keys()] } }).select('title price stock');
  const byId = new Map(books.map(book => [book.id, book]));
  const items = [...quantities].map(([id, quantity]) => {
    const book = byId.get(id);
    if (!book) throw new ApiError(404, 'A book in your bag could not be found.');
    if (book.stock < quantity) throw new ApiError(409, `Not enough stock is available for "${book.title}".`);
    return { book: id, title: book.title, quantity, price: book.price, stock: book.stock, itemTotal: Math.round(book.price * quantity * 100) / 100 };
  });
  res.json({ success: true, items, totalPrice: Math.round(items.reduce((sum, item) => sum + item.itemTotal, 0) * 100) / 100 });
}

export async function confirmCheckoutSession(req, res) {
  const sessionId = req.body?.sessionId;
  if (typeof sessionId !== 'string' || sessionId.length > 255 || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    throw new ApiError(400, 'A valid Stripe Checkout session ID is required.');
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  const attempt = await CheckoutAttempt.findOne({
    checkoutSessionId: sessionId,
    user: req.user.id
  });

  if (!attempt || checkoutSession.client_reference_id !== req.user.id ||
      checkoutSession.metadata?.checkoutAttemptId !== attempt.id) {
    throw new ApiError(404, 'This checkout session does not belong to your account.');
  }
  if (attempt.status === 'refunded') {
    throw new ApiError(409, 'This payment was refunded because the books were no longer in stock.');
  }
  if (checkoutSession.payment_status !== 'paid' ||
      checkoutSession.amount_total !== attempt.amountTotal ||
      checkoutSession.currency !== 'usd') {
    throw new ApiError(409, 'Payment has not been completed or could not be verified.');
  }

  if (attempt.status === 'completed') {
    const existingOrder = await Order.findById(attempt.order)
      .populate('items.book', 'title author coverImage');
    if (!existingOrder) throw new ApiError(404, 'The order linked to this payment could not be found.');
    return res.json({ success: true, order: existingOrder });
  }

  const purchasedLineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ['data.price.product']
  });
  const verifiedItems = purchasedLineItems.data.map(line => ({
    bookId: line.price?.product?.metadata?.bookId,
    quantity: line.quantity,
    amount: line.amount_total
  })).sort((a, b) => String(a.bookId).localeCompare(String(b.bookId)));
  const expectedItems = attempt.items.map(item => ({
    bookId: item.book.toString(),
    quantity: item.quantity,
    amount: Math.round(item.price * 100) * item.quantity
  })).sort((a, b) => a.bookId.localeCompare(b.bookId));

  if (JSON.stringify(verifiedItems) !== JSON.stringify(expectedItems)) {
    throw new ApiError(409, 'The paid items did not match this order. Please contact support.');
  }

  const mongoSession = await mongoose.startSession();
  let createdOrder;
  let inventoryChanged = false;

  try {
    await mongoSession.withTransaction(async () => {
      const orderItems = [];
      let totalPrice = 0;
      for (const item of attempt.items) {
        const bookDetails = await Book.findById(item.book).session(mongoSession);
        const book = await Book.findOneAndUpdate(
          { _id: item.book, stock: { $gte: item.quantity }, price: item.price },
          { $inc: { stock: -item.quantity } },
          { new: true, session: mongoSession }
        );
        if (!book) {
          const title = bookDetails?.title || 'A book in your order';
          inventoryChanged = true;
          throw new ApiError(409, `Stock or price changed for "${title}" after payment.`);
        }
        orderItems.push({ book: book._id, quantity: item.quantity, price: item.price });
        totalPrice += item.price * item.quantity;
      }

      totalPrice = Math.round(totalPrice * 100) / 100;
      const [order] = await Order.create([{
        user: req.user.id,
        items: orderItems,
        shippingAddress: attempt.shippingAddress,
        totalPrice,
        isPaid: true
      }], { session: mongoSession });
      const completion = await CheckoutAttempt.updateOne(
        { _id: attempt._id, status: 'pending' },
        { $set: { status: 'completed', order: order._id } },
        { session: mongoSession }
      );
      if (completion.modifiedCount !== 1) {
        throw new ApiError(409, 'This payment is already being processed. Please check your orders.');
      }
      createdOrder = order;
    });
  } catch (error) {
    if (inventoryChanged && checkoutSession.payment_intent) {
      try {
        await stripe.refunds.create(
          { payment_intent: checkoutSession.payment_intent },
          { idempotencyKey: `pageturner-stock-refund-${attempt.id}` }
        );
        attempt.status = 'refunded';
        await attempt.save();
        throw new ApiError(409, 'Payment was automatically refunded because stock or price changed. Please try again.');
      } catch (refundError) {
        if (refundError instanceof ApiError) throw refundError;
        throw new ApiError(502, 'We could not complete the order or confirm its refund. Please contact support before trying again.');
      }
    }
    throw error;
  } finally {
    await mongoSession.endSession();
  }

  await createdOrder.populate('items.book', 'title author coverImage');
  res.status(201).json({ success: true, order: createdOrder });
}

/**
 * Returns only orders belonging to the signed-in customer.
 */
export async function getMyOrders(req, res) {
  const { page, limit } = readOrdersPage(req.query);
  const filter = { user: req.user.id };
  const totalOrders = await Order.countDocuments(filter);
  const totalPages = Math.ceil(totalOrders / limit);
  const orders = page > totalPages ? [] : await Order.find(filter)
    .populate('items.book', 'title author coverImage')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, count: orders.length, pagination: { page, limit, totalOrders, totalPages }, orders });
}

/**
 * Returns one order only when it belongs to the signed-in customer.
 */
export async function getMyOrder(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Order not found.');
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
    .populate('items.book', 'title author coverImage');
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json({ success: true, order });
}

/**
 * Cancels a processing order and restores its reserved inventory atomically.
 */
export async function cancelMyOrder(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Order not found.');
  }

  const session = await mongoose.startSession();
  let cancelledOrder;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id, status: 'processing' },
        { $set: { status: 'cancelled' } },
        { new: true, session }
      );

      if (!order) {
        const exists = await Order.exists({ _id: req.params.id, user: req.user.id }).session(session);
        if (!exists) throw new ApiError(404, 'Order not found.');
        throw new ApiError(409, 'Only processing orders can be cancelled.');
      }

      for (const item of order.items) {
        await Book.updateOne(
          { _id: item.book },
          { $inc: { stock: item.quantity } },
          { session }
        );
      }
      cancelledOrder = order;
    });
  } finally {
    await session.endSession();
  }

  await cancelledOrder.populate('items.book', 'title author coverImage');
  res.json({ success: true, message: 'Order cancelled and inventory restored.', order: cancelledOrder });
}

/**
 * Administrator view of all orders, newest first.
 */
export async function getAllOrders(req, res) {
  const { page, limit } = readOrdersPage(req.query);
  const totalOrders = await Order.countDocuments();
  const totalPages = Math.ceil(totalOrders / limit);
  const orders = page > totalPages ? [] : await Order.find()
    .populate('user', 'name email')
    .populate('items.book', 'title author coverImage')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, count: orders.length, pagination: { page, limit, totalOrders, totalPages }, orders });
}

export async function getAdminOrder(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Order not found.');
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.book', 'title author coverImage');
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json({ success: true, order });
}

/**
 * Changes the fulfillment status of an order; payment is handled separately.
 */
export async function updateOrderStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Order ID is not a valid MongoDB ObjectId.');
  }

  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      order = await Order.findById(req.params.id).session(session);
      if (!order) throw new ApiError(404, 'Order not found.');
      if (order.status === 'cancelled' && req.body.status !== 'cancelled') {
        throw new ApiError(409, 'A cancelled order cannot be reopened.');
      }
      const restoreInventory = order.status !== 'cancelled' && req.body.status === 'cancelled';
      order.status = req.body.status;
      await order.save({ session });
      if (restoreInventory) {
        for (const item of order.items) {
          await Book.updateOne({ _id: item.book }, { $inc: { stock: item.quantity } }, { session });
        }
      }
    });
  } finally { await session.endSession(); }
  await order.populate('user', 'name email');
  await order.populate('items.book', 'title author coverImage');
  res.json({ success: true, order });
}
