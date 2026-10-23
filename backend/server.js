// Load .env FIRST, before any other file is imported
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import authRoutes from './routes/authRoutes.js';
import recruiterAuthRoutes from './routes/recruiterAuthRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
// STEP 7: uncomment the next line after you create middleware/rateLimiter.js
import { initRateLimiters } from './middleware/rateLimiter.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/recruiter-auth', recruiterAuthRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interview', interviewRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'JobGraph API is running' });
});

app.use(errorHandler);

app.use(cors({
  origin: 'https://https://jobby-opal.vercel.app/',
  credentials: true
}));

const startServer = async () => {
  await connectDB();       // 1) MongoDB (required)
  await connectRedis();    // 2) Redis (optional: app still works if it fails)
  // STEP 7: uncomment the next line after you create middleware/rateLimiter.js
  initRateLimiters();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();