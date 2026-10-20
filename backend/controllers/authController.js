import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { parseResumeWithAI, generateEmbedding } from '../services/groqService.js';
import { calculateResumeScore } from '../services/scoringService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const signToken = (user) => jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

const extractText = async (buffer, mimeType) => {
  if (!buffer) return '';
  if (mimeType === 'application/pdf') {
    const data = typeof pdfParse === 'function' ? await pdfParse(buffer) : await (new pdfParse.PDFParse({ data: buffer })).getText();
    return data?.text || '';
  }
  return buffer.toString('utf-8');
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'candidate', company } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields required' });

    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashedPassword, role, company: role === 'recruiter' ? company : undefined
    });

    res.status(201).json({
      success: true,
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, company: user.company }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { password: _, resumeFileData: __, ...userData } = user.toObject();
    res.json({
      success: true,
      token: signToken(user),
      user: { id: user._id, ...userData }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -resumeFileData');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updateData = {};
    let content = req.body.resumeText || null;

    if (req.file) {
      content = await extractText(req.file.buffer, req.file.mimetype);
      updateData.resumeOriginalName = req.file.originalname;
      updateData.resumeMimeType = req.file.mimetype;
      updateData.resumeFileName = req.file.originalname;
      updateData.resumeFileSize = req.file.size;
      updateData.resumeFileData = req.file.buffer;
      updateData.resumeUploadedAt = new Date();
    }

    if (content?.trim()) {
      const parsed = await parseResumeWithAI(content, req.file?.originalname || 'resume.txt');
      const skillsText = `${parsed.skills.join(', ')} ${parsed.summary || ''}`;

      Object.assign(updateData, {
        skills: parsed.skills,
        skillsEmbedding: await generateEmbedding(skillsText),
        experience: parsed.experience,
        education: parsed.education,
        summary: parsed.summary,
        phone: parsed.phone,
        resumeScore: calculateResumeScore(parsed),
        ...(!req.body.reparse ? { resume: content } : {})
      });
    }

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.profileLinks) {
      try { updateData.profileLinks = JSON.parse(req.body.profileLinks); } catch {}
    }

    const user = await User.findByIdAndUpdate(req.userId, updateData, { new: true }).select('-password -resumeFileData');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllCandidates = async (req, res) => {
  try {
    const { minScore, maxScore, skills, sortBy } = req.query;
    const query = { role: 'candidate' };

    if (minScore || maxScore) {
      query.resumeScore = {};
      if (minScore) query.resumeScore.$gte = Number(minScore);
      if (maxScore) query.resumeScore.$lte = Number(maxScore);
    }

    if (skills) {
      const skillList = skills.split(',').map(s => s.trim().toLowerCase());
      query.skills = { $elemMatch: { $regex: skillList.join('|'), $options: 'i' } };
    }

    const sortMap = { 'score-asc': { resumeScore: 1 }, name: { name: 1 } };
    const sort = sortMap[sortBy] || { resumeScore: -1 };

    const candidates = await User.find(query).select('-password -resume -skillsEmbedding -resumeFileData').sort(sort);
    res.json({ success: true, count: candidates.length, candidates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const downloadCandidateResume = async (req, res) => {
  try {
    const candidate = await User.findOne({ _id: req.params.candidateId, role: 'candidate' }).select('name resumeFileData resumeFileName resumeFileMimeType');
    if (!candidate?.resumeFileData) return res.status(404).json({ success: false, message: 'Resume not found' });

    const fileName = (candidate.resumeFileName || `${candidate.name || 'candidate'}-resume`).replace(/"/g, '');
    res.setHeader('Content-Type', candidate.resumeFileMimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(candidate.resumeFileData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
