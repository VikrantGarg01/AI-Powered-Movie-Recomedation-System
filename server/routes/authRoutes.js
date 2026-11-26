import express from 'express';
import {
  register,
  verifyEmail,
  login,
  verifyLoginOtp,
  resendOtp,
  getMe,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/login', authLimiter, login);
router.post('/verify-login-otp', authLimiter, verifyLoginOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
