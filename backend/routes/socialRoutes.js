import express from 'express';
import {
  getConnectedAccounts,
  syncLiveMetrics,
  getAdminCreatorMetrics
} from '../controllers/socialController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/accounts', protect, getConnectedAccounts);
router.post('/sync/:platform', protect, syncLiveMetrics);
router.get('/admin/metrics', protect, getAdminCreatorMetrics);

export default router;
