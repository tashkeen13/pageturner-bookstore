import { Router } from 'express';
import { createReview, deleteOwnReview, listReviews, updateOwnReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateReviewBody } from '../middleware/validateReview.js';

const router = Router();

router.get('/:bookId/reviews', listReviews);
router.post('/:bookId/reviews', protect, validateReviewBody, createReview);
router.patch('/:bookId/reviews/:reviewId', protect, validateReviewBody, updateOwnReview);
router.delete('/:bookId/reviews/:reviewId', protect, deleteOwnReview);

export default router;
