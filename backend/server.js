import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import recruiterAuthRoutes from './routes/recruiterAuthRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

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

let server;

const startServer = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();

// Graceful Shutdown implementation
const handleShutdown = (signal) => {
  console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      
      // Close Mongoose connection
      import('mongoose').then(({ default: mongoose }) => {
        mongoose.connection.close(false).then(() => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
