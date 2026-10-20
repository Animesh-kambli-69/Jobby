import express from 'express';
import {
	generateInterviewQuestions,
	evaluateInterviewPerformance,
	analyzeInterview,
	uploadInterviewRecording,
	getMyInterviewRecordings,
	getInterviewRecordingsForRecruiter
} from '../controllers/interviewController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { uploadInterviewVideo, handleMulterError } from '../middleware/uploadMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// These three call Groq AI, so they share the daily AI limit (per user).
// aiLimiter goes AFTER authMiddleware because it counts by req.userId.
router.get('/questions', authMiddleware, requireRole(['candidate']), aiLimiter, generateInterviewQuestions);
router.post('/performance', authMiddleware, requireRole(['candidate']), aiLimiter, evaluateInterviewPerformance);
router.post('/analyze', authMiddleware, requireRole(['candidate']), aiLimiter, analyzeInterview);

// These don't call AI, so no AI limit.
router.post('/recordings', authMiddleware, requireRole(['candidate']), uploadInterviewVideo.single('video'), handleMulterError, uploadInterviewRecording);
router.get('/recordings/me', authMiddleware, requireRole(['candidate']), getMyInterviewRecordings);
router.get('/recordings', authMiddleware, requireRole(['recruiter']), getInterviewRecordingsForRecruiter);

export default router;