import express from 'express';
import {
  getTeamMembers,
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  getChatMessages,
  postChatMessage
} from '../controllers/teamController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/members', getTeamMembers);
router.get('/tasks', getTasks);
router.post('/tasks', authorize('Creator', 'Super Admin', 'Admin'), createTask);
router.put('/tasks/:id', updateTaskStatus);
router.delete('/tasks/:id', authorize('Creator', 'Super Admin'), deleteTask);

router.get('/chat', getChatMessages);
router.post('/chat', postChatMessage);

export default router;
