import express from 'express';
import { search, suggest, trending } from '../controllers/search';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { success: false, error: { code: 'TOO_MANY_SEARCHES', message: 'Rate limit exceeded for search.' } }
});

router.get('/', searchLimiter, search);
router.get('/suggest', searchLimiter, suggest);
router.get('/trending', trending);

export default router;
