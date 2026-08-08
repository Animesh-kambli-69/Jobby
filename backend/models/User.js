import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['candidate', 'recruiter'],
    default: 'candidate'
  },
  phone: {
    type: String
  },
  resume: {
    type: String
  },
  resumeOriginalName: {
    type: String
  },
  resumeMimeType: {
    type: String
  },
  resumeFileName: {
    type: String
  },
  resumeFileMimeType: {
    type: String
  },
  resumeFileSize: {
    type: Number,
    default: 0
  },
  resumeFileData: {
    type: Buffer
  },
  resumeCloudinaryUrl: {
    type: String
  },
  resumeCloudinaryPublicId: {
    type: String
  },
  resumeUploadedAt: {
    type: Date
  },
  resumeUploadSource: {
    type: String,
    enum: ['file', 'text']
  },
  skills: [{
    type: String
  }],
  skillsEmbedding: [{
    type: Number
  }],
  experience: {
    type: String
  },
  education: {
    type: String
  },
  summary: {
    type: String
  },
  profileLinks: {
    github: { type: String },
    linkedin: { type: String },
    leetcode: { type: String },
    portfolio: { type: String }
  },
  resumeScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  company: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);
