import express from 'express';
import {
	applyForJob,
	getApplicationsByJob,
	updateApplicationStatus,
	getMyApplications,
	getMyApplicationSummary
} from '../controllers/applicationController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/apply', authMiddleware, requireRole(['candidate']), applyForJob);
router.get('/my', authMiddleware, requireRole(['candidate']), getMyApplications);
router.get('/my/summary', authMiddleware, requireRole(['candidate']), getMyApplicationSummary);
router.get('/job/:jobId', authMiddleware, requireRole(['recruiter']), getApplicationsByJob);
router.patch('/:id/status', authMiddleware, requireRole(['recruiter']), updateApplicationStatus);
export default router;
