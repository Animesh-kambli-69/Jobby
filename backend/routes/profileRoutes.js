import express from 'express';
import { parseResume } from '../controllers/profileController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/parse-resume', upload.single('resume'), parseResume);

export default router;
