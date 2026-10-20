import InterviewAnalysis from '../models/InterviewAnalysis.js';
import InterviewRecording from '../models/InterviewRecording.js';
import User from '../models/User.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const callGroq = async (system, user) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature: 0.2
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch {
    return null;
  }
};

export const generateInterviewQuestions = async (req, res) => {
  try {
    const interviewType = req.query.interviewType || req.body?.interviewType || 'mixed';
    const difficulty = req.query.difficulty || req.body?.difficulty || 'intermediate';
    const user = await User.findById(req.userId).select('skills experience education');

    const prompt = `Generate 5 ${interviewType} questions (${difficulty}) based on skills: ${(user?.skills || []).join(', ')}. Return JSON: {"questions": ["q1", "q2", "q3", "q4", "q5"]}`;
    const data = await callGroq('You generate interview questions. Return strict JSON.', prompt);

    const questions = data?.questions?.length ? data.questions.slice(0, 5) : [
      'Explain a challenging technical project you worked on.',
      'How do you debug complex production issues?',
      'Describe a time you collaborated under tight deadlines.',
      'How do you design scalable APIs?',
      'Tell me about your experience with your primary tech stack.'
    ];

    res.json({ success: true, interviewType, difficulty, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const evaluateInterviewPerformance = async (req, res) => {
  try {
    const { interviewType = 'mixed', difficulty = 'intermediate', qaPairs = [], metrics = [], totalDurationSeconds = 0 } = req.body;
    const prompt = JSON.stringify({ interviewType, difficulty, qaPairs, metrics, totalDurationSeconds });
    const data = await callGroq('Evaluate mock interview. Return JSON: {"overallScore": number 0-100, "strengths": string[], "improvements": string[], "tips": string[]}', prompt);

    const performance = data || {
      overallScore: 75,
      strengths: ['Clear answers', 'Good technical coverage'],
      improvements: ['Give more concrete examples', 'Structure using STAR method'],
      tips: ['Practice concise answers', 'Highlight quantifiable impact']
    };

    res.json({ success: true, performance: { ...performance, totalDurationSeconds } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const analyzeInterview = async (req, res) => {
  try {
    const { transcript = '', eye_contact_percentage = 0, duration = 0 } = req.body;
    if (!transcript.trim()) return res.status(400).json({ success: false, message: 'Transcript is required' });

    const eyeContact = Math.min(100, Math.max(0, Number(eye_contact_percentage)));
    const data = await callGroq(
      'Interview coach. Return JSON: {"score": 0-100, "confidence": 0-1, "eye_contact": string, "feedback": string}',
      JSON.stringify({ transcript, eye_contact_percentage: eyeContact, duration })
    );

    const analysis = data || {
      score: eyeContact,
      confidence: 0.5,
      eye_contact: eyeContact >= 60 ? 'Good' : 'Needs improvement',
      feedback: 'Keep practicing clear and structured answers.'
    };

    const record = await InterviewAnalysis.create({
      userId: req.userId,
      transcript,
      eyeContactPercentage: eyeContact,
      duration,
      score: analysis.score ?? eyeContact,
      confidence: analysis.confidence ?? 0.5,
      eyeContact: analysis.eye_contact || 'Fair',
      feedback: analysis.feedback || 'Good attempt.'
    });

    res.json({ success: true, analysis, savedId: record._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadInterviewRecording = async (req, res) => {
  try {
    const { interviewType = 'mixed', duration = 0 } = req.body;
    if (!req.file?.buffer) return res.status(400).json({ success: false, message: 'Video file is required' });
    if (!isCloudinaryConfigured()) return res.status(500).json({ success: false, message: 'Cloudinary not configured' });

    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: `jobgraph/interviews/${interviewType}` },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const recording = await InterviewRecording.create({
      userId: req.userId,
      interviewType,
      cloudinaryUrl: uploaded.secure_url,
      cloudinaryPublicId: uploaded.public_id,
      format: uploaded.format || req.file.mimetype,
      duration: Number(duration),
      bytes: req.file.size
    });

    res.status(201).json({ success: true, recording });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyInterviewRecordings = async (req, res) => {
  try {
    const recordings = await InterviewRecording.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, count: recordings.length, recordings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getInterviewRecordingsForRecruiter = async (req, res) => {
  try {
    const { interviewType, userId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (interviewType) query.interviewType = interviewType;
    if (userId) query.userId = userId;

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [recordings, total] = await Promise.all([
      InterviewRecording.find(query).populate('userId', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      InterviewRecording.countDocuments(query)
    ]);

    res.json({ success: true, total, page: Number(page), recordings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
