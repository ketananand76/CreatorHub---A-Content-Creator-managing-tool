import express from 'express';
import {
  login,
  register,
  firebaseSync,
  socialLogin,
  refreshToken,
  setup2FA,
  verify2FA,
  disable2FA,
  getProfile,
  updateProfile
} from '../controllers/authController.js';
import { socialLoginByHandle } from '../controllers/socialController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/firebase-sync', firebaseSync);
router.post('/social-login', socialLogin);
router.post('/social-login-handle', socialLoginByHandle);
router.post('/refresh-token', refreshToken);

// Protected Auth & Profile Routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);

export default router;
