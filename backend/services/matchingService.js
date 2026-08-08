import { generateEmbedding } from './groqService.js';
import { calculateCosineSimilarity } from '../utils/cosineSimilarity.js';

export const calculateMatchScore = async (candidateSkills, jobSkills) => {
  try {
    const candidateText = candidateSkills.join(', ');
    const jobText = jobSkills.join(', ');

    const candidateEmbedding = await generateEmbedding(candidateText);
    const jobEmbedding = await generateEmbedding(jobText);

    const similarity = calculateCosineSimilarity(candidateEmbedding, jobEmbedding);
    return Math.round(similarity * 100);
  } catch (error) {
    console.error('Match score calculation error:', error);
    return 0;
  }
};
