import express from 'express';
import {
  register,
  verifyOTP,
  login,
  socialLogin,
  refreshToken,
  setup2FA,
  verify2FA,
  disable2FA,
  forgotPassword,
  resetPassword,
  resendOTP,
  getProfile,
  updateProfile,
  verifyEmailLink
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/verify-email', verifyEmailLink);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected Auth & Profile Routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);

export default router;
