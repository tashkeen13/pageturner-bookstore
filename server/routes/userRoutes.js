import { Router } from 'express';
import { changePassword, getProfile, updateProfile } from '../controllers/profileController.js';
import { getWishlist, toggleWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validatePasswordChange } from '../middleware/validatePasswordChange.js';

const router = Router();

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, validatePasswordChange, changePassword);
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:bookId', protect, toggleWishlist);

export default router;
