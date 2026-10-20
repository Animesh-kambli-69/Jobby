import Groq from 'groq-sdk';
import { remember, hashKey } from '../utils/cache.js';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY.trim() }) : null;
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const FAST_MODEL = process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b';

const parseResumeWithAIUncached = async (fileContent) => {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are an expert resume parser. Extract information into strict JSON with keys: name, email, phone, skills (array of strings), experience, education, summary.' },
        { role: 'user', content: fileContent }
      ],
      temperature: 0.1
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      name: parsed.name || 'Unknown',
      email: parsed.email || 'unknown@email.com',
      phone: parsed.phone || '',
      skills: Array.isArray(parsed.skills) ? parsed.skills.filter(Boolean) : [],
      experience: parsed.experience || 'Entry Level',
      education: parsed.education || '',
      summary: parsed.summary || ''
    };
  } catch (error) {
    console.error('Resume parse error:', error.message);
    return { name: 'Unknown', email: 'unknown@email.com', phone: '', skills: [], experience: 'Entry Level', education: '', summary: '' };
  }
};

const COMMON_SKILLS = [
  'javascript', 'python', 'java', 'c++', 'typescript', 'react', 'node', 'express',
  'mongodb', 'sql', 'postgresql', 'redis', 'aws', 'docker', 'git', 'rest', 'api'
];

const generateEmbeddingUncached = async (text) => {
  try {
    const completion = await groq.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        { role: 'system', content: 'Return top 20 technical keywords as a comma-separated list.' },
        { role: 'user', content: text }
      ],
      temperature: 0
    });

    const keywords = (completion.choices[0]?.message?.content || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const all = [...new Set([...keywords, ...COMMON_SKILLS])];
    const embedding = Array(768).fill(0);
    const textLower = text.toLowerCase();

    all.slice(0, 768).forEach((k, idx) => {
      if (textLower.includes(k)) embedding[idx] = 1;
    });

    const mag = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)) || 1;
    return embedding.map(v => v / mag);
  } catch (error) {
    console.error('Embedding error:', error.message);
    return Array(768).fill(0);
  }
};

export const extractSkillsFromFile = async (fileContent) => {
  try {
    const completion = await groq.chat.completions.create({
      model: FAST_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Extract technical skills from resume into JSON: { "skills": ["skill1", "skill2"] }' },
        { role: 'user', content: fileContent }
      ],
      temperature: 0.1
    });

    const data = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return Array.isArray(data.skills) ? data.skills : [];
  } catch (error) {
    console.error('Skill extraction error:', error.message);
    return [];
  }
};

const ONE_DAY = 86400;

export const parseResumeWithAI = (content, fileName) =>
  remember(`ai:resume:${hashKey(content)}`, ONE_DAY, () => parseResumeWithAIUncached(content, fileName), {
    shouldCache: (res) => res?.skills?.length > 0
  });

export const generateEmbedding = (text) =>
  remember(`ai:embedding:${hashKey(text)}`, 7 * ONE_DAY, () => generateEmbeddingUncached(text), {
    shouldCache: (vec) => vec?.some(v => v !== 0)
  });