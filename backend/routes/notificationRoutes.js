import express from 'express';
import {
  getUserNotifications,
  markNotificationRead,
  createBroadcastNotification,
  getBroadcastHistory,
  deleteBroadcast,
  remindBroadcast
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserNotifications);
router.post('/:id/read', markNotificationRead);
router.post('/broadcast', authorize('Super Admin', 'Admin'), createBroadcastNotification);
router.get('/broadcasts', authorize('Super Admin', 'Admin'), getBroadcastHistory);
router.delete('/broadcast/:id', authorize('Super Admin', 'Admin'), deleteBroadcast);
router.post('/broadcast/:id/reminder', authorize('Super Admin', 'Admin'), remindBroadcast);

export default router;
