import express from 'express';
import { register, login, getMe, updateProfile, getAllCandidates, downloadCandidateResume } from '../controllers/authController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, upload.single('resume'), updateProfile);
router.get('/candidates', authMiddleware, requireRole(['recruiter']), getAllCandidates);
router.get('/candidates/:candidateId/resume', authMiddleware, requireRole(['recruiter']), downloadCandidateResume);

export default router;
