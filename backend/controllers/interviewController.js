import InterviewAnalysis from '../models/InterviewAnalysis.js';
import InterviewRecording from '../models/InterviewRecording.js';
import User from '../models/User.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const MODEL = 'llama-3.3-70b-versatile';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildFallbackAnalysis = (eyeContactPercentage) => ({
  score: Math.round(clamp(eyeContactPercentage, 0, 100)),
  confidence: 0.35,
  eye_contact: eyeContactPercentage >= 60 ? 'Maintained fairly well' : 'Frequent looking away',
  feedback: 'AI model unavailable. Continue practicing concise, structured responses.'
});

const fallbackQuestionBank = {
  technical: [
    'Explain one project from your resume where you made a key technical design choice. What tradeoffs did you evaluate?',
    'Pick one core skill listed on your resume. Describe how you used it to solve a difficult bug or performance issue.',
    'If we asked you to extend one project from your resume for production scale, what would you change first and why?',
    'Describe a system or feature you built and explain how data flows through it end-to-end.',
    'Tell me about a technical challenge from your resume and how you validated your final solution.'
  ],
  behavioral: [
    'Tell me about a time you collaborated with others on a project from your resume and handled differing opinions.',
    'Describe a deadline pressure moment from your experience and how you prioritized work.',
    'Share a mistake or failure from one of your projects and what you changed afterward.',
    'Tell me about a time you learned a new tool or framework quickly to deliver a result.',
    'Describe how you communicate progress and blockers when working in a team.'
  ],
  mixed: [
    'Choose one project from your resume and explain both the technical implementation and your personal contribution.',
    'Describe a challenging feature you built, then explain how you collaborated with others to deliver it.',
    'Pick one skill from your resume and give a practical example of where it had measurable impact.',
    'Tell me about a project decision you made, what alternatives you considered, and the final outcome.',
    'If you were to improve one project from your resume today, what technical and process changes would you apply?'
  ]
};

const normalizeInterviewType = (type) => {
  if (['technical', 'behavioral', 'mixed'].includes(type)) {
    return type;
  }
  return 'mixed';
};

const normalizeQuestionKey = (question) => String(question || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const ensureUniqueQuestions = ({ questions = [], interviewType = 'mixed', count = 5 }) => {
  const seen = new Set();
  const unique = [];

  for (const question of questions) {
    const clean = String(question || '').trim();
    if (!clean) continue;
    const key = normalizeQuestionKey(clean);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(clean);
    if (unique.length >= count) {
      return unique;
    }
  }

  const fallbackPool = fallbackQuestionBank[interviewType] || fallbackQuestionBank.mixed;
  for (const question of fallbackPool) {
    const clean = String(question || '').trim();
    const key = normalizeQuestionKey(clean);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(clean);
    if (unique.length >= count) {
      return unique;
    }
  }

  // Safety filler to always return the requested count with unique prompts.
  let fillerIndex = 1;
  while (unique.length < count) {
    const filler = `Tell me about a resume project where you solved challenge #${fillerIndex} and what impact it had.`;
    const key = normalizeQuestionKey(filler);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(filler);
    }
    fillerIndex += 1;
  }

  return unique;
};

const getCandidateResumeContext = async (userId) => {
  const user = await User.findById(userId).select('name skills experience education summary resume');
  if (!user) {
    throw new Error('User not found');
  }

  return {
    name: user.name || 'Candidate',
    skills: Array.isArray(user.skills) ? user.skills : [],
    experience: user.experience || 'Not specified',
    education: user.education || 'Not specified',
    summary: user.summary || '',
    resume: user.resume || ''
  };
};

const requestGroqQuestions = async ({ interviewType, difficulty, resumeContext, count = 5 }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }

  const prompt = `
Generate ${count} ${interviewType} interview questions for difficulty level "${difficulty}".

Rules:
1. Questions must be based on the candidate resume context below.
2. Questions must be practical and role-relevant.
3. Keep each question short and direct (max 2 sentences).
4. Avoid duplicate or generic questions.
5. Return only valid JSON in this exact shape:
{"questions":["question 1","question 2","question 3","question 4","question 5"]}

Candidate resume context:
${JSON.stringify(resumeContext)}
`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You generate structured interview question sets. Output must be strict JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1200
    })
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(content);
    const questions = Array.isArray(parsed?.questions)
      ? parsed.questions.map((q) => String(q || '').trim()).filter(Boolean)
      : [];

    return questions.length ? questions.slice(0, count) : null;
  } catch (error) {
    return null;
  }
};

const requestGroqPerformanceSummary = async ({ interviewType, difficulty, qaPairs = [], metrics = [], totalDurationSeconds = 0 }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !qaPairs.length) {
    return null;
  }

  const prompt = `
Evaluate this mock interview and score candidate performance.

Interview type: ${interviewType}
Difficulty: ${difficulty}
Total interview duration (seconds): ${totalDurationSeconds}

Q&A pairs:
${JSON.stringify(qaPairs)}

Per-question metrics:
${JSON.stringify(metrics)}

Return strict JSON with this exact shape:
{
  "overallScore": 0-100 number,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "tips": ["...", "...", "..."]
}

Keep arrays concise (3-5 items each).
`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a structured interview evaluator. Return strict JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1200
    })
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(content);
    return {
      overallScore: clamp(Number(parsed.overallScore ?? 0), 0, 100),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map((x) => String(x)).filter(Boolean).slice(0, 5) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map((x) => String(x)).filter(Boolean).slice(0, 5) : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips.map((x) => String(x)).filter(Boolean).slice(0, 5) : []
    };
  } catch (error) {
    return null;
  }
};

export const generateInterviewQuestions = async (req, res) => {
  try {
    const interviewType = normalizeInterviewType(req.query.interviewType || req.body?.interviewType);
    const difficulty = String(req.query.difficulty || req.body?.difficulty || 'intermediate').toLowerCase();

    const resumeContext = await getCandidateResumeContext(req.userId);
    const groqQuestions = await requestGroqQuestions({
      interviewType,
      difficulty,
      resumeContext,
      count: 5
    });

    const questions = ensureUniqueQuestions({
      questions: groqQuestions || fallbackQuestionBank[interviewType],
      interviewType,
      count: 5
    });

    return res.json({
      success: true,
      source: groqQuestions ? 'groq' : 'fallback',
      interviewType,
      difficulty,
      questions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const evaluateInterviewPerformance = async (req, res) => {
  try {
    const interviewType = normalizeInterviewType(req.body?.interviewType);
    const difficulty = String(req.body?.difficulty || 'intermediate').toLowerCase();
    const qaPairs = Array.isArray(req.body?.qaPairs) ? req.body.qaPairs : [];
    const metrics = Array.isArray(req.body?.metrics) ? req.body.metrics : [];
    const totalDurationSeconds = Math.max(0, Number(req.body?.totalDurationSeconds || 0));

    const averageMetricScore = metrics.length
      ? Math.round(metrics.reduce((sum, item) => sum + Number(item?.score || 0), 0) / metrics.length)
      : 0;

    const fallback = {
      overallScore: clamp(averageMetricScore || 70, 0, 100),
      strengths: [
        'Maintained a clear communication flow',
        'Attempted structured answers',
        'Engaged with interview prompts consistently'
      ],
      improvements: [
        'Add more concrete examples from projects',
        'Explain tradeoffs and decision criteria clearly',
        'Keep answers concise and outcome-focused'
      ],
      tips: [
        'Use STAR format for behavioral answers',
        'Quantify impact with metrics where possible',
        'Clarify assumptions before proposing solutions'
      ]
    };

    const groqSummary = await requestGroqPerformanceSummary({
      interviewType,
      difficulty,
      qaPairs,
      metrics,
      totalDurationSeconds
    });

    return res.json({
      success: true,
      source: groqSummary ? 'groq' : 'fallback',
      performance: {
        ...(groqSummary || fallback),
        totalDurationSeconds
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const uploadVideoBufferToCloudinary = ({ buffer, userId, interviewType }) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      resource_type: 'video',
      folder: `jobgraph/interview-recordings/${interviewType}`,
      public_id: `${userId}-${interviewType}-${Date.now()}`
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    }
  );

  stream.end(buffer);
});

const requestGroqAnalysis = async ({ transcript, eyeContactPercentage, duration }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return buildFallbackAnalysis(eyeContactPercentage);
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an interview coach. Return strictly valid JSON with keys: score (0-100), confidence (0-1), eye_contact (string), feedback (string).'
        },
        {
          role: 'user',
          content: JSON.stringify({
            transcript,
            eye_contact_percentage: eyeContactPercentage,
            duration
          })
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    return buildFallbackAnalysis(eyeContactPercentage);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content || '{}';

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    return buildFallbackAnalysis(eyeContactPercentage);
  }

  return {
    score: clamp(Number(parsed.score ?? eyeContactPercentage), 0, 100),
    confidence: clamp(Number(parsed.confidence ?? 0.4), 0, 1),
    eye_contact: String(parsed.eye_contact ?? ''),
    feedback: String(parsed.feedback ?? '')
  };
};

export const analyzeInterview = async (req, res) => {
  try {
    const { transcript, eye_contact_percentage, duration } = req.body;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Transcript is required'
      });
    }

    const eyeContactPercentage = clamp(Number(eye_contact_percentage || 0), 0, 100);
    const safeDuration = Math.max(0, Number(duration || 0));

    const analysis = await requestGroqAnalysis({
      transcript: transcript.trim(),
      eyeContactPercentage,
      duration: safeDuration
    });

    const record = await InterviewAnalysis.create({
      userId: req.userId,
      transcript: transcript.trim(),
      eyeContactPercentage,
      duration: safeDuration,
      score: analysis.score,
      confidence: analysis.confidence,
      eyeContact: analysis.eye_contact,
      feedback: analysis.feedback
    });

    return res.json({
      success: true,
      analysis: {
        score: analysis.score,
        confidence: analysis.confidence,
        eye_contact: analysis.eye_contact,
        feedback: analysis.feedback
      },
      savedId: record._id
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const uploadInterviewRecording = async (req, res) => {
  try {
    const { interviewType, duration } = req.body;
    const allowedTypes = ['technical', 'behavioral', 'mixed'];

    if (!allowedTypes.includes(interviewType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid interviewType is required (technical, behavioral, mixed)'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }

    if (!req.file.buffer || !req.file.size) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded video is invalid or empty'
      });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured on server'
      });
    }

    const uploaded = await uploadVideoBufferToCloudinary({
      buffer: req.file.buffer,
      userId: req.userId,
      interviewType
    });

    const record = await InterviewRecording.create({
      userId: req.userId,
      interviewType,
      cloudinaryUrl: uploaded.secure_url,
      cloudinaryPublicId: uploaded.public_id,
      format: uploaded.format || req.file.mimetype,
      duration: Math.max(0, Number(duration || 0)),
      bytes: Number(uploaded.bytes || req.file.size || 0)
    });

    return res.status(201).json({
      success: true,
      message: 'Interview recording uploaded successfully',
      recording: record
    });
  } catch (error) {
    console.error('Interview recording upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload interview recording'
    });
  }
};

export const getMyInterviewRecordings = async (req, res) => {
  try {
    const recordings = await InterviewRecording.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: recordings.length,
      recordings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getInterviewRecordingsForRecruiter = async (req, res) => {
  try {
    const { interviewType, userId, fromDate, toDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (interviewType && ['technical', 'behavioral', 'mixed'].includes(interviewType)) {
      query.interviewType = interviewType;
    }

    if (userId) {
      query.userId = userId;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const [recordings, total] = await Promise.all([
      InterviewRecording.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      InterviewRecording.countDocuments(query)
    ]);

    return res.json({
      success: true,
      page: pageNumber,
      limit: pageSize,
      total,
      recordings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
