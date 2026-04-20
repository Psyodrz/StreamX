import express from 'express';
import { register, login, refresh, logout, registerSchema, loginSchema } from '../controllers/auth';
import { authenticate, validateBody } from '../middleware/auth';

const router = express.Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);

export default router;
