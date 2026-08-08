import express from 'express';
import { createJob, searchJobs, getJobById, getAllJobs } from '../controllers/jobController.js';

const router = express.Router();

router.post('/create', createJob);
router.post('/search', searchJobs);
router.get('/all', getAllJobs);
router.get('/:id', getJobById);

export default router;
