import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, me } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict rate limiting for authentication attempts (max 10 tries per 15 mins)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP address. Please wait 15 minutes before trying again.' }
});

router.post('/login', loginLimiter, login);
router.get('/me', authMiddleware, me);

export default router;
