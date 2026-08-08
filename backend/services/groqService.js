import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const parseResumeWithAI = async (fileContent, fileName = 'resume.txt') => {
  try {
    console.log('🤖 Groq AI: Starting resume parse...');

    const prompt = `
You are an expert resume parser and skill extractor. Analyze this resume carefully and extract ALL relevant information.

IMPORTANT: Extract as many technical skills, tools, and technologies as you can find. Include:
- Programming languages (JavaScript, Python, Java, C++, etc.)
- Frameworks (React, Angular, Vue, Node.js, Django, Spring, etc.)
- Databases (MongoDB, PostgreSQL, MySQL, Redis, etc.)
- Cloud platforms (AWS, Azure, GCP, etc.)
- DevOps tools (Docker, Kubernetes, Jenkins, Git, etc.)
- Other technical skills mentioned

Return ONLY a valid JSON object with this exact structure:
{
  "name": "Full Name from resume",
  "email": "email@example.com",
  "phone": "phone number or empty string",
  "skills": ["skill1", "skill2", "skill3", "...extract ALL skills..."],
  "experience": "X years of experience" or "Entry Level" or "Fresher",
  "education": "Highest degree and institution",
  "summary": "Brief 2-3 sentence professional summary based on the resume"
}

Resume Content:
${fileContent}

Remember:
1. Return ONLY the JSON object, no markdown, no code blocks, no explanations
2. Extract EVERY technical skill mentioned in the resume
3. If information is not found, use reasonable defaults
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume parser. Extract all information accurately. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 2048
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('🤖 Groq AI raw response length:', responseText.length);

    // Clean up the response
    let jsonText = responseText.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      const result = {
        name: parsed.name || 'Unknown',
        email: parsed.email || 'unknown@email.com',
        phone: parsed.phone || '',
        skills: Array.isArray(parsed.skills) ? parsed.skills.filter(s => s && s.trim()) : [],
        experience: parsed.experience || 'Entry Level',
        education: parsed.education || '',
        summary: parsed.summary || ''
      };

      console.log('✅ Groq AI: Successfully parsed. Skills found:', result.skills.length);
      return result;
    }

    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('❌ Resume parsing error:', error.message);
    return {
      name: 'Unknown',
      email: 'unknown@email.com',
      phone: '',
      skills: [],
      experience: 'Entry Level',
      education: '',
      summary: ''
    };
  }
};

export const generateEmbedding = async (text) => {
  try {
    const prompt = `Extract the top 25 most important technical keywords and skills from this text.
Focus on: programming languages, frameworks, databases, tools, cloud services, methodologies.
Return them as a comma-separated list, nothing else:

${text}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You extract technical keywords. Return only comma-separated keywords, nothing else.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens: 300
    });

    const keywords = completion.choices[0]?.message?.content || '';
    const keywordList = keywords
      .toLowerCase()
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    return createSimpleEmbedding(text, keywordList);
  } catch (error) {
    console.error('Embedding generation error:', error.message);
    return Array(768).fill(0);
  }
};

const createSimpleEmbedding = (text, keywords) => {
  const embedding = Array(768).fill(0);
  const textLower = text.toLowerCase();

  // Extended list of common tech skills for matching
  const commonSkills = [
    // Languages
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript',
    'php', 'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab', 'dart', 'lua',
    // Frontend
    'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'gatsby', 'html', 'css',
    'sass', 'less', 'tailwind', 'bootstrap', 'material-ui', 'chakra',
    // Backend
    'node', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'fastapi',
    'nestjs', 'gin', 'fiber', 'asp.net', 'graphql', 'rest', 'api',
    // Databases
    'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'dynamodb',
    'cassandra', 'firebase', 'supabase', 'prisma', 'sequelize',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'github actions',
    'terraform', 'ansible', 'ci/cd', 'linux', 'nginx', 'apache',
    // Tools
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'figma',
    // AI/ML
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
    'nlp', 'computer vision', 'data science', 'pandas', 'numpy', 'scikit-learn',
    // Testing
    'jest', 'mocha', 'pytest', 'selenium', 'cypress', 'playwright', 'junit',
    // Methodologies
    'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'microservices', 'serverless',
    // Other
    'blockchain', 'web3', 'solidity', 'react native', 'flutter', 'electron'
  ];

  const allKeywords = [...new Set([...keywords, ...commonSkills])];

  allKeywords.forEach((keyword, idx) => {
    if (idx >= 768) return;

    try {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = textLower.match(regex);
      const count = matches ? matches.length : 0;

      embedding[idx] = Math.min(count / 10, 1.0);
    } catch (e) {
      // Skip invalid regex patterns
    }
  });

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return embedding.map(val => val / magnitude);
  }

  return embedding;
};

export const extractSkillsFromFile = async (fileContent) => {
  try {
    const prompt = `Extract ALL technical skills, programming languages, frameworks, databases, tools, and technologies from this resume.

Resume:
${fileContent}

Return ONLY a JSON array of strings like: ["JavaScript", "React", "Node.js", "MongoDB"]
Include every technical skill you can find. Return ONLY the JSON array.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 500
    });

    const responseText = completion.choices[0]?.message?.content || '[]';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const skills = JSON.parse(jsonMatch[0]);
      return Array.isArray(skills) ? skills : [];
    }

    return [];
  } catch (error) {
    console.error('Skill extraction error:', error.message);
    return [];
  }
};
