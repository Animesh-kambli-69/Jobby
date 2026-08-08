import mongoose from 'mongoose';

const interviewAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  transcript: {
    type: String,
    required: true
  },
  eyeContactPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  eyeContact: {
    type: String,
    required: true
  },
  feedback: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('InterviewAnalysis', interviewAnalysisSchema);
