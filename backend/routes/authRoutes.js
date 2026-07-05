import express from 'express';
import {
  register,
  verifyOTP,
  login,
  googleLogin,
  refreshToken,
  setup2FA,
  verify2FA,
  disable2FA,
  forgotPassword,
  resetPassword,
  resendOTP,
  getProfile,
  updateProfile,
  getFirebaseConfig
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/firebase-config', getFirebaseConfig);
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/google-login', googleLogin);
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
