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

const router = express.Router();

router.get('/questions', authMiddleware, requireRole(['candidate']), generateInterviewQuestions);
router.post('/performance', authMiddleware, requireRole(['candidate']), evaluateInterviewPerformance);
router.post('/analyze', authMiddleware, requireRole(['candidate']), analyzeInterview);
router.post('/recordings', authMiddleware, requireRole(['candidate']), uploadInterviewVideo.single('video'), handleMulterError, uploadInterviewRecording);
router.get('/recordings/me', authMiddleware, requireRole(['candidate']), getMyInterviewRecordings);
router.get('/recordings', authMiddleware, requireRole(['recruiter']), getInterviewRecordingsForRecruiter);

export default router;
