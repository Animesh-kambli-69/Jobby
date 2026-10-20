import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const createToken = (u) => jwt.sign({ userId: u._id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '7d' });

export const registerRecruiter = async (req, res) => {
  try {
    const { name, email, password, company } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !company?.trim()) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(), email: normalizedEmail, password: hashedPassword, role: 'recruiter', company: company.trim()
    });

    res.status(201).json({
      success: true,
      token: createToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, company: user.company }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const loginRecruiter = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user || user.role !== 'recruiter' || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid recruiter credentials' });
    }

    res.json({
      success: true,
      token: createToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, company: user.company }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRecruiterMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user || user.role !== 'recruiter') return res.status(403).json({ success: false, message: 'Unauthorized' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRecruiterDashboardSummary = async (req, res) => {
  try {
    const recruiter = await User.findById(req.userId).select('company role');
    if (recruiter?.role !== 'recruiter') return res.status(403).json({ success: false, message: 'Unauthorized' });

    const jobQuery = recruiter.company ? { company: recruiter.company } : { recruiterId: recruiter._id };
    const jobs = await Job.find(jobQuery).select('_id status requiredSkills').lean();
    const jobIds = jobs.map(j => j._id);
    const applications = jobIds.length ? await Application.find({ jobId: { $in: jobIds } }).select('status jobId candidateEmail').lean() : [];

    const skillCounts = {};
    jobs.forEach(j => (j.requiredSkills || []).forEach(s => skillCounts[s] = (skillCounts[s] || 0) + 1));
    const topRequiredSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([skill, count]) => ({ skill, count }));

    res.json({
      success: true,
      summary: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        closedJobs: jobs.filter(j => j.status === 'closed').length,
        totalApplications: applications.length,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        acceptedApplications: applications.filter(a => a.status === 'accepted').length,
        rejectedApplications: applications.filter(a => a.status === 'rejected').length,
        uniqueCandidates: new Set(applications.map(a => a.candidateEmail?.toLowerCase()).filter(Boolean)).size,
        topRequiredSkills
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
