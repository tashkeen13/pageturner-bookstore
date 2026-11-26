import { Router } from 'express';
import { login, register, requestPasswordReset, resetPassword } from '../controllers/authController.js';
import { validateLogin, validateRegister, validatePasswordResetRequest, validatePasswordReset } from '../middleware/validateAuth.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validatePasswordResetRequest, requestPasswordReset);
router.post('/reset-password', validatePasswordReset, resetPassword);

export default router;
