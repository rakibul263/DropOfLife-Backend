import { Router } from 'express';
import { register, login, getMe, logout, googleAuth } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);

export default router;
