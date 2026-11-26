import { Router } from 'express';
import {
  deleteAdminReview,
  deleteAdminUser,
  getDashboard,
  listAdminReviews,
  listAdminUsers,
  updateAdminUser
} from '../controllers/adminController.js';
import { uploadBookCover } from '../controllers/imageController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';
import imageUpload from '../middleware/imageUpload.js';
import { ApiError } from '../middleware/errorMiddleware.js';
import { getAdminOrder } from '../controllers/orderController.js';
import { listContactMessages } from '../controllers/contactController.js';

const router = Router();

router.use(protect, adminOnly);
router.get('/dashboard', getDashboard);
router.get('/orders/:id', getAdminOrder);
router.get('/messages', listContactMessages);
router.get('/users', listAdminUsers);
router.patch('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);
router.get('/reviews', listAdminReviews);
router.delete('/reviews/:id', deleteAdminReview);
router.post('/upload-cover', (req, res, next) => {
  imageUpload.single('cover')(req, res, error => {
    if (error) {
      next(error);
      return;
    }
    if (!req.is('multipart/form-data')) {
      next(new ApiError(400, 'Upload a JPEG, PNG, or WebP file as multipart form data.'));
      return;
    }
    next();
  });
}, uploadBookCover);

export default router;
