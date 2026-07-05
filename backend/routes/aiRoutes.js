import express from 'express';
import {
  generateCaption,
  generateScript,
  generateViralSuggestions
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/caption', generateCaption);
router.post('/script', generateScript);
router.post('/viral-suggestions', generateViralSuggestions);

export default router;
