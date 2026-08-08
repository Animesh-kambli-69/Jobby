export const calculateResumeScore = (parsedData) => {
  let score = 0;

  if (!parsedData) return 0;

  const experienceScore = calculateExperienceScore(parsedData.experience);
  score += experienceScore * 0.3;

  const skillsScore = calculateSkillsScore(parsedData.skills);
  score += skillsScore * 0.4;

  const contentScore = calculateContentScore(parsedData);
  score += contentScore * 0.3;

  return Math.round(Math.min(score, 100));
};

const calculateExperienceScore = (experience) => {
  if (!experience) return 0;

  const expLower = experience.toLowerCase();

  const yearMatch = expLower.match(/(\d+)\s*(year|yr)/i);
  if (yearMatch) {
    const years = parseInt(yearMatch[1]);
    if (years >= 10) return 100;
    if (years >= 7) return 90;
    if (years >= 5) return 80;
    if (years >= 3) return 70;
    if (years >= 2) return 60;
    if (years >= 1) return 50;
    return 40;
  }

  if (expLower.includes('senior') || expLower.includes('lead') || expLower.includes('principal')) {
    return 90;
  }
  if (expLower.includes('mid') || expLower.includes('intermediate')) {
    return 70;
  }
  if (expLower.includes('junior') || expLower.includes('entry')) {
    return 50;
  }
  if (expLower.includes('fresher') || expLower.includes('graduate')) {
    return 40;
  }

  return 30;
};

const calculateSkillsScore = (skills) => {
  if (!skills || !Array.isArray(skills) || skills.length === 0) return 0;

  const skillCount = skills.length;

  const hardSkills = [
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript',
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
    'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'jenkins',
    'git', 'github', 'gitlab', 'bitbucket',
    'machine learning', 'deep learning', 'ai', 'data science', 'tensorflow', 'pytorch',
    'rest api', 'graphql', 'microservices', 'agile', 'scrum',
    'html', 'css', 'sass', 'webpack', 'vite',
    'testing', 'jest', 'mocha', 'pytest', 'selenium', 'cypress'
  ];

  const skillsLower = skills.map(s => s.toLowerCase());
  const hardSkillCount = skillsLower.filter(skill =>
    hardSkills.some(hs => skill.includes(hs) || hs.includes(skill))
  ).length;

  let score = 0;

  if (skillCount >= 20) score += 40;
  else if (skillCount >= 15) score += 35;
  else if (skillCount >= 10) score += 30;
  else if (skillCount >= 7) score += 25;
  else if (skillCount >= 5) score += 20;
  else score += 10;

  if (hardSkillCount >= 10) score += 60;
  else if (hardSkillCount >= 7) score += 50;
  else if (hardSkillCount >= 5) score += 40;
  else if (hardSkillCount >= 3) score += 30;
  else score += 15;

  return Math.min(score, 100);
};

const calculateContentScore = (parsedData) => {
  let score = 0;

  if (parsedData.name && parsedData.name !== 'Unknown') {
    score += 15;
  }

  if (parsedData.email && parsedData.email !== 'unknown@email.com' && parsedData.email.includes('@')) {
    score += 15;
  }

  if (parsedData.phone && parsedData.phone.length > 0) {
    score += 10;
  }

  if (parsedData.education && parsedData.education.length > 0) {
    score += 20;

    const eduLower = parsedData.education.toLowerCase();
    if (eduLower.includes('master') || eduLower.includes('phd') || eduLower.includes('mba')) {
      score += 10;
    } else if (eduLower.includes('bachelor') || eduLower.includes('degree')) {
      score += 5;
    }
  }

  if (parsedData.summary && parsedData.summary.length > 50) {
    score += 20;
    if (parsedData.summary.length > 200) {
      score += 10;
    }
  }

  if (parsedData.skills && parsedData.skills.length > 0) {
    score += 10;
  }

  return Math.min(score, 100);
};

export const getScoreLabel = (score) => {
  // Cognitive Curator Design System Colors
  if (score >= 85) return { label: 'Excellent', color: '#10b981' };     // Success green
  if (score >= 70) return { label: 'Very Good', color: '#9fa7ff' };     // Primary indigo
  if (score >= 55) return { label: 'Good', color: '#3adffa' };          // Secondary cyan
  if (score >= 40) return { label: 'Average', color: '#f59e0b' };       // Warning
  return { label: 'Needs Improvement', color: '#ef4444' };              // Error
};
