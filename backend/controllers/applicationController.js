import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { calculateMatchScore } from '../services/matchingService.js';

const canManage = async (recruiterId, job) => {
  const recruiter = await User.findById(recruiterId).select('role company');
  return recruiter?.role === 'recruiter' && (
    String(job.recruiterId) === String(recruiterId) || recruiter.company === job.company
  );
};

export const applyForJob = async (req, res) => {
  try {
    const { jobId, candidateSkills, resume } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });

    const candidate = await User.findById(req.userId).select('name email skills');
    const job = await Job.findById(jobId);
    if (!candidate || !job) return res.status(404).json({ success: false, message: 'Candidate or Job not found' });

    const email = candidate.email.toLowerCase().trim();
    const existing = await Application.findOne({ jobId, candidateEmail: email });
    if (existing) return res.status(409).json({ success: false, message: 'Already applied' });

    const skills = candidateSkills?.length ? candidateSkills : (candidate.skills || []);
    const matchScore = await calculateMatchScore(skills, job.requiredSkills);

    const application = await Application.create({
      jobId, candidateName: candidate.name, candidateEmail: email, candidateSkills: skills, resume, matchScore
    });

    res.status(201).json({ success: true, application });
  } catch (err) {
    res.status(err?.code === 11000 ? 409 : 500).json({ success: false, message: err.message });
  }
};

export const getApplicationsByJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).select('_id company recruiterId');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (!(await canManage(req.userId, job))) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const applications = await Application.find({ jobId: req.params.jobId }).sort({ matchScore: -1 }).lean();
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
    }

    const application = await Application.findById(req.params.id);
    const job = application && await Job.findById(application.jobId).select('_id company recruiterId');
    if (!application || !job) return res.status(404).json({ success: false, message: 'Not found' });
    if (!(await canManage(req.userId, job))) return res.status(403).json({ success: false, message: 'Unauthorized' });

    application.status = status;
    await application.save();
    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const applications = await Application.find({ candidateEmail: user.email.toLowerCase() })
      .populate('jobId', 'title company location salary status')
      .sort({ appliedAt: -1 })
      .lean();

    res.json({ success: true, count: applications.length, applications: applications.map(a => ({ ...a, job: a.jobId })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyApplicationSummary = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const apps = await Application.find({ candidateEmail: user.email.toLowerCase() }).select('status').lean();
    res.json({
      success: true,
      summary: {
        applied: apps.length,
        rejected: apps.filter(a => a.status === 'rejected').length,
        accepted: apps.filter(a => a.status === 'accepted').length,
        pending: apps.filter(a => ['pending', 'reviewed'].includes(a.status)).length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
