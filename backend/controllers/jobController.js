// backend/controllers/jobController.js
import Job from '../models/Job.js';
import { generateEmbedding } from '../services/groqService.js';
import { calculateCosineSimilarity } from '../utils/cosineSimilarity.js';
import { remember, cacheDel } from '../utils/cache.js';               // NEW

const ACTIVE_JOBS_KEY = 'jobs:active';                                 // NEW
const FIVE_MINUTES = 5 * 60;                                           // NEW
const TEN_MINUTES = 10 * 60;                                           // NEW

// NEW: one shared, cached way to load active jobs (used by two endpoints)
const getActiveJobs = () =>
  remember(ACTIVE_JOBS_KEY, FIVE_MINUTES, () =>
    Job.find({ status: 'active' }).sort({ createdAt: -1 }).lean()
  );

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
    await cacheDel(ACTIVE_JOBS_KEY);   // NEW: the list changed, so throw away the old copy

    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchJobs = async (req, res) => {
  try {
    const { candidateSkills } = req.body;

    let jobs = await getActiveJobs();                                  // CHANGED: cached list

    if (candidateSkills && candidateSkills.length > 0) {
      const candidateEmbedding = await generateEmbedding(candidateSkills.join(', ')); // cached in Step 5

      jobs = jobs.map((job) => ({
        ...job,                                                        // CHANGED: plain object, no .toObject()
        matchScore: Math.round(calculateCosineSimilarity(candidateEmbedding, job.skillsEmbedding) * 100)
      }));
      jobs.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      jobs = jobs.map((job) => ({ ...job, matchScore: 0 }));            // CHANGED
    }

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await remember(`job:${req.params.id}`, TEN_MINUTES, () =>   // CHANGED
      Job.findById(req.params.id).lean()
    );
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
    const jobs = await getActiveJobs();                                // CHANGED
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};