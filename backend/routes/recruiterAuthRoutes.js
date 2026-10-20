import express from 'express';
import {
	registerRecruiter,
	loginRecruiter,
	getRecruiterMe,
	getRecruiterDashboardSummary
} from '../controllers/recruiterAuthController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Login and sign-up: max 10 failed attempts per 15 minutes per IP
router.post('/register', authLimiter, registerRecruiter);
router.post('/login', authLimiter, loginRecruiter);

router.get('/me', authMiddleware, requireRole(['recruiter']), getRecruiterMe);
router.get('/summary', authMiddleware, requireRole(['recruiter']), getRecruiterDashboardSummary);

export default router;