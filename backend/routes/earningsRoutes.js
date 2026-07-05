import express from 'express';
import {
  getEarnings,
  addLog,
  deleteLog
} from '../controllers/earningsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getEarnings);
router.post('/', addLog);
router.delete('/:id', deleteLog);

export default router;
