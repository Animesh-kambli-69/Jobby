import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password = '') => {
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasUpper && hasLower && hasDigit;
};

const createToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const registerRecruiter = async (req, res) => {
  try {
    const { name, email, password, company } = req.body;
    const normalizedName = (name || '').trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedCompany = (company || '').trim();

    if (!normalizedName || !normalizedEmail || !password || !normalizedCompany) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and company'
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'recruiter',
      company: normalizedCompany
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: 'Recruiter registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Recruiter registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const loginRecruiter = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'This account is not a recruiter account'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      message: 'Recruiter login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Recruiter login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getRecruiterMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    if (user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: recruiter only endpoint'
      });
    }

    return res.json({
      success: true,
      user,
      profileCompleteness: {
        hasCompany: Boolean(user.company),
        hasPhone: Boolean(user.phone),
        hasProfileLinks: Boolean(user.profileLinks?.linkedin || user.profileLinks?.github),
        score: [user.company, user.phone, user.profileLinks?.linkedin || user.profileLinks?.github]
          .filter(Boolean).length
      }
    });
  } catch (error) {
    console.error('Get recruiter profile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getRecruiterDashboardSummary = async (req, res) => {
  try {
    const recruiter = await User.findById(req.userId).select('company role');
    if (!recruiter || recruiter.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: recruiter only endpoint'
      });
    }

    const jobQuery = recruiter.company
      ? { company: recruiter.company }
      : { recruiterId: recruiter._id };

    const jobs = await Job.find(jobQuery).select('_id status requiredSkills');
    const jobIds = jobs.map((job) => job._id);

    const applications = jobIds.length > 0
      ? await Application.find({ jobId: { $in: jobIds } }).select('status jobId candidateEmail')
      : [];

    const activeJobs = jobs.filter((job) => job.status === 'active').length;
    const closedJobs = jobs.filter((job) => job.status === 'closed').length;
    const pendingApplications = applications.filter((app) => app.status === 'pending').length;
    const acceptedApplications = applications.filter((app) => app.status === 'accepted').length;
    const rejectedApplications = applications.filter((app) => app.status === 'rejected').length;

    const applicationsByJob = {};
    const uniqueCandidateEmails = new Set();
    applications.forEach((application) => {
      const key = String(application.jobId);
      applicationsByJob[key] = (applicationsByJob[key] || 0) + 1;
      if (application.candidateEmail) {
        uniqueCandidateEmails.add(application.candidateEmail.toLowerCase());
      }
    });

    const skillCounts = new Map();
    jobs.forEach((job) => {
      (job.requiredSkills || []).forEach((skill) => {
        const key = String(skill || '').trim();
        if (!key) return;
        skillCounts.set(key, (skillCounts.get(key) || 0) + 1);
      });
    });

    const topRequiredSkills = [...skillCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));

    return res.json({
      success: true,
      summary: {
        totalJobs: jobs.length,
        activeJobs,
        closedJobs,
        totalApplications: applications.length,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        uniqueCandidates: uniqueCandidateEmails.size,
        applicationsByJob,
        topRequiredSkills
      }
    });
  } catch (error) {
    console.error('Recruiter summary error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
