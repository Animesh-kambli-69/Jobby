import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: 'Tech Corp'
  },
  location: {
    type: String,
    default: 'Remote'
  },
  salary: {
    type: String
  },
  requiredSkills: [{
    type: String
  }],
  skillsEmbedding: [{
    type: Number
  }],
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Job', jobSchema);
