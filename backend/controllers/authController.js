import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { parseResumeWithAI, generateEmbedding } from '../services/groqService.js';
import { calculateResumeScore } from '../services/scoringService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to extract text from different file types
const extractTextFromFile = async (fileBuffer, mimeType) => {
  try {
    if (mimeType === 'application/pdf') {
      // pdf-parse v2 uses class-based API (PDFParse), while older versions expose a function.
      if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(fileBuffer);
        return pdfData.text || '';
      }

      if (pdfParse && typeof pdfParse.PDFParse === 'function') {
        const parser = new pdfParse.PDFParse({ data: fileBuffer });
        const pdfData = await parser.getText();
        await parser.destroy();
        return pdfData?.text || '';
      }

      throw new Error('Unsupported pdf-parse module format');
    } else if (mimeType === 'text/plain') {
      // Plain text file
      return fileBuffer.toString('utf-8');
    } else if (
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // For DOC/DOCX, read as text (basic support)
      // For full support, would need mammoth or similar library
      return fileBuffer.toString('utf-8');
    }

    // Default: try to read as text
    return fileBuffer.toString('utf-8');
  } catch (error) {
    console.error('Error extracting text from file:', error.message);
    throw new Error(`Failed to extract text from resume file: ${error.message}`);
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'candidate',
      company: role === 'recruiter' ? company : undefined
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        resumeScore: user.resumeScore,
        skills: user.skills,
        experience: user.experience,
        education: user.education,
        summary: user.summary,
        profileLinks: user.profileLinks,
        resume: user.resume ? 'uploaded' : null,
        resumeOriginalName: user.resumeOriginalName || null,
        resumeMimeType: user.resumeMimeType || null,
        resumeCloudinaryUrl: user.resumeCloudinaryUrl || null,
        resumeCloudinaryPublicId: user.resumeCloudinaryPublicId || null,
        resumeUploadedAt: user.resumeUploadedAt || null,
        resumeUploadSource: user.resumeUploadSource || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -resumeFileData');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const updateData = {};
    let resumeContent = null;

    console.log('📄 Profile update request received');
    console.log('File:', req.file ? req.file.originalname : 'No file');
    console.log('Body keys:', Object.keys(req.body));

    // Handle file upload (PDF, DOC, DOCX, TXT)
    if (req.file) {
      const mimeType = req.file.mimetype;
      const fileBuffer = req.file.buffer;

      console.log('📁 Processing file:', req.file.originalname, 'Type:', mimeType);

      // Extract text from the uploaded file
      resumeContent = await extractTextFromFile(fileBuffer, mimeType);

      console.log('✅ Extracted text length:', resumeContent.length, 'characters');

      updateData.resumeOriginalName = req.file.originalname;
      updateData.resumeMimeType = mimeType;
      updateData.resumeFileName = req.file.originalname;
      updateData.resumeFileMimeType = mimeType;
      updateData.resumeFileSize = req.file.size || fileBuffer.length;
      updateData.resumeFileData = fileBuffer;
      updateData.resumeUploadedAt = new Date();
      updateData.resumeUploadSource = 'file';
    } else if (req.body.resumeText) {
      // Handle pasted text
      resumeContent = req.body.resumeText;
      console.log('📝 Using pasted text, length:', resumeContent.length);

      updateData.resumeOriginalName = 'Pasted resume text';
      updateData.resumeMimeType = 'text/plain';
      updateData.resumeUploadedAt = new Date();
      updateData.resumeUploadSource = 'text';
    }

    // Parse resume with Groq AI if we have content
    if (resumeContent && resumeContent.trim().length > 0) {
      console.log('🤖 Sending to Groq AI for parsing...');

      const parsedData = await parseResumeWithAI(resumeContent, req.file?.originalname || 'resume.txt');

      console.log('✅ Groq AI parsed data:', {
        name: parsedData.name,
        skillsCount: parsedData.skills?.length || 0,
        experience: parsedData.experience,
        education: parsedData.education
      });

      // Generate embedding for skill matching
      const skillsText = parsedData.skills.join(', ') + ' ' + (parsedData.summary || '');
      const embedding = await generateEmbedding(skillsText);

      // Calculate resume score
      const resumeScore = calculateResumeScore(parsedData);
      console.log('📊 Resume score calculated:', resumeScore);

      // Update user data
      updateData.skills = parsedData.skills;
      updateData.skillsEmbedding = embedding;
      updateData.experience = parsedData.experience;
      updateData.education = parsedData.education;
      updateData.summary = parsedData.summary;
      updateData.phone = parsedData.phone;
      updateData.resumeScore = resumeScore;

      // Store the raw resume text in database (unless just reparsing)
      if (!req.body.reparse) {
        updateData.resume = resumeContent;
        console.log('💾 Resume text will be stored in database');
      }
    }

    // Handle profile links
    if (req.body.profileLinks) {
      try {
        updateData.profileLinks = JSON.parse(req.body.profileLinks);
      } catch (e) {
        console.error('Error parsing profile links:', e);
      }
    }

    // Handle other fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.phone) updateData.phone = req.body.phone;

    // Update user in MongoDB
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password -resumeFileData');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile updated successfully for user:', user.email);

    res.json({
      success: true,
      message: 'Profile updated successfully! Skills extracted by AI.',
      user
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllCandidates = async (req, res) => {
  try {
    const { minScore, maxScore, skills, sortBy } = req.query;

    let query = { role: 'candidate' };

    // Filter by score range
    if (minScore || maxScore) {
      query.resumeScore = {};
      if (minScore) query.resumeScore.$gte = parseInt(minScore);
      if (maxScore) query.resumeScore.$lte = parseInt(maxScore);
    }

    // Filter by skills
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim().toLowerCase());
      query.skills = {
        $elemMatch: {
          $regex: skillArray.join('|'),
          $options: 'i'
        }
      };
    }

    // Sort options
    let sortOptions = {};
    if (sortBy === 'score-desc') {
      sortOptions.resumeScore = -1;
    } else if (sortBy === 'score-asc') {
      sortOptions.resumeScore = 1;
    } else if (sortBy === 'name') {
      sortOptions.name = 1;
    } else {
      sortOptions.resumeScore = -1; // Default: highest score first
    }

    const candidates = await User.find(query)
      .select('-password -resume -skillsEmbedding -resumeFileData') // Exclude large fields
      .sort(sortOptions);

    res.json({
      success: true,
      count: candidates.length,
      candidates
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const downloadCandidateResume = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await User.findOne({
      _id: candidateId,
      role: 'candidate'
    }).select('name resumeFileData resumeFileName resumeFileMimeType');

    if (!candidate || !candidate.resumeFileData) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found for this candidate'
      });
    }

    const safeFileName = String(candidate.resumeFileName || `${candidate.name || 'candidate'}-resume`)
      .replace(/"/g, '');

    res.setHeader('Content-Type', candidate.resumeFileMimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    return res.send(candidate.resumeFileData);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
