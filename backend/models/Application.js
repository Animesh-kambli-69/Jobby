import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  candidateSkills: [{
    type: String
  }],
  resume: {
    type: String
  },
  matchScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

// One candidate can apply only once per job.
applicationSchema.index({ jobId: 1, candidateEmail: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
