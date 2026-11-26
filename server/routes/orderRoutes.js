import { Router } from 'express';
import {
  confirmCheckoutSession,
  createCashOnDeliveryOrder,
  createCheckoutSession,
  cancelMyOrder,
  getAllOrders,
  getMyOrder,
  getMyOrders,
  quoteCheckout,
  updateOrderStatus
} from '../controllers/orderController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';
import { validateOrderBody, validateOrderStatus } from '../middleware/validateOrder.js';

const router = Router();

router.post('/checkout-session', protect, validateOrderBody, createCheckoutSession);
router.post('/quote', protect, quoteCheckout);
router.post('/cod', protect, validateOrderBody, createCashOnDeliveryOrder);
router.post('/confirm-checkout', protect, confirmCheckoutSession);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getMyOrder);
router.post('/:id/cancel', protect, cancelMyOrder);
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, validateOrderStatus, updateOrderStatus);

export default router;
