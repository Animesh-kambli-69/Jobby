import express from 'express';
import {
	registerRecruiter,
	loginRecruiter,
	getRecruiterMe,
	getRecruiterDashboardSummary
} from '../controllers/recruiterAuthController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerRecruiter);
router.post('/login', loginRecruiter);
router.get('/me', authMiddleware, requireRole(['recruiter']), getRecruiterMe);
router.get('/summary', authMiddleware, requireRole(['recruiter']), getRecruiterDashboardSummary);

export default router;
