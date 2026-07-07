import express from 'express';
import {
  submitTransaction,
  getMyTransactions,
  submitTicket,
  getMyTickets,
  getAdminStats,
  getUsersList,
  updateUserStatus,
  toggleUserPremium,
  updateUserRole,
  deleteUser,
  getPaymentLogs,
  approveTransaction,
  rejectTransaction,
  getSessionHistory,
  getAllTickets,
  replyTicket,
  getAdsenseSettings,
  updateAdsenseSettings,
  getCreatorPerformance,
  getAIPerformanceAnalysis,
  getReferralNetwork,
  masterEditUser
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public ad config endpoint so user panels can render ads even before auth is fully initialized.
router.get('/settings/adsense', getAdsenseSettings);

router.use(protect);

// User-facing settings & transaction & ticket routes
router.post('/subscription/submit', submitTransaction);
router.get('/subscription/my-transactions', getMyTransactions);
router.post('/support/submit', submitTicket);
router.get('/support/my-tickets', getMyTickets);

// Admin-only routing
router.get('/stats', authorize('Super Admin', 'Admin'), getAdminStats);
router.get('/users', authorize('Super Admin', 'Admin'), getUsersList);
router.put('/users/:userId/status', authorize('Super Admin', 'Admin'), updateUserStatus);
router.put('/users/:userId/toggle-premium', authorize('Super Admin', 'Admin'), toggleUserPremium);
router.put('/users/:userId/role', authorize('Super Admin', 'Admin'), updateUserRole);
router.delete('/users/:userId', authorize('Super Admin', 'Admin'), deleteUser);
router.get('/payment-logs', authorize('Super Admin', 'Admin'), getPaymentLogs);
router.post('/payment-logs/:transactionId/approve', authorize('Super Admin', 'Admin'), approveTransaction);
router.post('/payment-logs/:transactionId/reject', authorize('Super Admin', 'Admin'), rejectTransaction);
router.get('/session-history', authorize('Super Admin', 'Admin'), getSessionHistory);
router.get('/tickets', authorize('Super Admin', 'Admin'), getAllTickets);
router.post('/tickets/:ticketId/reply', authorize('Super Admin', 'Admin'), replyTicket);
router.post('/settings/adsense', authorize('Super Admin', 'Admin'), updateAdsenseSettings);
router.get('/performance/leaderboard', authorize('Super Admin', 'Admin'), getCreatorPerformance);
router.get('/performance/ai-analysis', authorize('Super Admin', 'Admin'), getAIPerformanceAnalysis);

export default router;

// Master Control Routes
router.get('/referrals/network', authorize('Super Admin', 'Admin'), getReferralNetwork);
router.put('/users/:userId/edit', authorize('Super Admin', 'Admin'), masterEditUser);
