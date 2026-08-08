import mongoose from 'mongoose';

const interviewRecordingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  interviewType: {
    type: String,
    enum: ['technical', 'behavioral', 'mixed'],
    required: true,
    index: true
  },
  cloudinaryUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
    index: true
  },
  format: {
    type: String
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  bytes: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('InterviewRecording', interviewRecordingSchema);
