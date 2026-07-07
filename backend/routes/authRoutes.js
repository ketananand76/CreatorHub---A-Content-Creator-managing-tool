import express from 'express';
import {
  register,
  verifyEmail,
  login,
  socialLogin,
  refreshToken,
  setup2FA,
  verify2FA,
  disable2FA,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile
} from '../controllers/authController.js';
import { socialLoginByHandle } from '../controllers/socialController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
// Removed verifyLogin route
router.post('/social-login', socialLogin);
router.post('/social-login-handle', socialLoginByHandle);
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
