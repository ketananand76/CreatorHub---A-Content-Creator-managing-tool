import express from 'express';
import {
  getUserNotifications,
  markNotificationRead,
  createBroadcastNotification
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserNotifications);
router.post('/:id/read', markNotificationRead);
router.post('/broadcast', authorize('Super Admin', 'Admin'), createBroadcastNotification);

export default router;
