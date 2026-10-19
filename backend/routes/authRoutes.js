import express from 'express';
import { register, login, getMe, updateProfile, getAllCandidates, downloadCandidateResume } from '../controllers/authController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { authLimiter, aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Login and sign-up: max 10 failed attempts per 15 minutes per IP
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

router.get('/me', authMiddleware, getMe);

// Profile update parses the resume with Groq AI, so it gets the daily AI limit.
// authMiddleware must come BEFORE aiLimiter because the limiter counts per req.userId.
router.put('/profile', authMiddleware, aiLimiter, upload.single('resume'), updateProfile);

router.get('/candidates', authMiddleware, requireRole(['recruiter']), getAllCandidates);
router.get('/candidates/:candidateId/resume', authMiddleware, requireRole(['recruiter']), downloadCandidateResume);

export default router;