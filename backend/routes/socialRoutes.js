import express from 'express';
import { syncSocialLink, disconnectSocialLink } from '../controllers/socialController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/sync', protect, syncSocialLink);
router.post('/disconnect', protect, disconnectSocialLink);

export default router;
