import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { calculateMatchScore } from '../services/matchingService.js';

const canRecruiterManageJob = async (recruiterId, job) => {
  const recruiter = await User.findById(recruiterId).select('role company');
  if (!recruiter || recruiter.role !== 'recruiter') {
    return false;
  }

  if (job.recruiterId && String(job.recruiterId) === String(recruiterId)) {
    return true;
  }

  if (recruiter.company && job.company && recruiter.company === job.company) {
    return true;
  }

  return false;
};

export const applyForJob = async (req, res) => {
  try {
    const { jobId, candidateName, candidateEmail, candidateSkills, resume } = req.body;

    if (!jobId || !candidateName || !candidateEmail) {
      return res.status(400).json({
        success: false,
        message: 'jobId, candidateName, and candidateEmail are required'
      });
    }

    const normalizedEmail = String(candidateEmail).trim().toLowerCase();

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const existingApplication = await Application.findOne({
      jobId,
      candidateEmail: normalizedEmail
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    const matchScore = await calculateMatchScore(candidateSkills, job.requiredSkills);

    const application = new Application({
      jobId,
      candidateName,
      candidateEmail: normalizedEmail,
      candidateSkills,
      resume,
      matchScore
    });

    await application.save();
    res.status(201).json({ success: true, application });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicationsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).select('_id company recruiterId');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const hasAccess = await canRecruiterManageJob(req.userId, job);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You can only view applications for your own jobs' });
    }

    const applications = await Application.find({ jobId }).sort({ matchScore: -1 });

    const candidateEmails = [...new Set(applications.map((application) => application.candidateEmail))];
    const candidates = await User.find({
      role: 'candidate',
      email: { $in: candidateEmails }
    }).select('email resumeFileName resumeOriginalName resumeCloudinaryUrl');

    const candidateMap = new Map(
      candidates.map((candidate) => [String(candidate.email).toLowerCase(), candidate])
    );

    const enrichedApplications = applications.map((application) => {
      const candidate = candidateMap.get(String(application.candidateEmail || '').toLowerCase());
      return {
        ...application.toObject(),
        candidateId: candidate?._id || null,
        resumeFileName: candidate?.resumeFileName || null,
        resumeOriginalName: candidate?.resumeOriginalName || null,
        resumeCloudinaryUrl: candidate?.resumeCloudinaryUrl || null
      };
    });

    res.json({ success: true, applications: enrichedApplications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['accepted', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be accepted or rejected'
      });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const job = await Job.findById(application.jobId).select('_id company recruiterId');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const hasAccess = await canRecruiterManageJob(req.userId, job);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You can only update applications for your own jobs' });
    }

    application.status = status;
    await application.save();

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const candidate = await User.findOne({
      _id: req.userId,
      role: 'candidate'
    }).select('email');

    if (!candidate?.email) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    const applications = await Application.find({
      candidateEmail: String(candidate.email).toLowerCase()
    })
      .populate('jobId', 'title company location salary status')
      .sort({ createdAt: -1 });

    const normalized = applications.map((application) => ({
      ...application.toObject(),
      job: application.jobId || null
    }));

    return res.json({
      success: true,
      count: normalized.length,
      applications: normalized
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyApplicationSummary = async (req, res) => {
  try {
    const candidate = await User.findOne({
      _id: req.userId,
      role: 'candidate'
    }).select('email');

    if (!candidate?.email) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    const candidateEmail = String(candidate.email).toLowerCase();
    const applications = await Application.find({ candidateEmail }).select('status');

    const summary = {
      applied: applications.length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
      accepted: applications.filter((a) => a.status === 'accepted').length,
      pending: applications.filter((a) => a.status === 'pending' || a.status === 'reviewed').length
    };

    return res.json({
      success: true,
      summary
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
