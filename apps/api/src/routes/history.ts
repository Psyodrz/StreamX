import express from 'express';
import { logPlay, getHistory } from '../controllers/history';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getHistory);
router.post('/songs/:id/play', authenticate, logPlay);

export default router;
