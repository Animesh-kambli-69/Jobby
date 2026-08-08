import Job from '../models/Job.js';
import { generateEmbedding } from '../services/groqService.js';
import { calculateCosineSimilarity } from '../utils/cosineSimilarity.js';

export const createJob = async (req, res) => {
  try {
    const { title, description, company, location, salary, requiredSkills } = req.body;

    const skillsText = requiredSkills.join(', ');
    const embedding = await generateEmbedding(skillsText);

    const job = new Job({
      title,
      description,
      company: company || 'Tech Corp',
      location: location || 'Remote',
      salary,
      requiredSkills,
      skillsEmbedding: embedding
    });

    await job.save();
    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchJobs = async (req, res) => {
  try {
    const { query, candidateSkills } = req.body;

    let jobs = await Job.find({ status: 'active' });

    if (candidateSkills && candidateSkills.length > 0) {
      const candidateSkillsText = candidateSkills.join(', ');
      const candidateEmbedding = await generateEmbedding(candidateSkillsText);

      jobs = jobs.map(job => {
        const similarity = calculateCosineSimilarity(candidateEmbedding, job.skillsEmbedding);
        return {
          ...job.toObject(),
          matchScore: Math.round(similarity * 100)
        };
      });

      jobs.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      jobs = jobs.map(job => ({
        ...job.toObject(),
        matchScore: 0
      }));
    }

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
