import api from './api';

export const getCandidates = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.minScore) params.append('minScore', filters.minScore);
  if (filters.maxScore) params.append('maxScore', filters.maxScore);
  if (filters.skills) params.append('skills', filters.skills);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);

  const response = await api.get(`/auth/candidates?${params.toString()}`);
  return response.data.candidates;
};

export const getRecruiterSummary = async () => {
  const response = await api.get('/recruiter-auth/summary');
  return response.data.summary;
};

export const downloadCandidateResume = async (candidateId) => {
  const response = await api.get(`/auth/candidates/${candidateId}/resume`, {
    responseType: 'blob'
  });

  const contentDisposition = response.headers['content-disposition'] || '';
  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  const fileName = fileNameMatch?.[1] || 'resume';

  return {
    blob: response.data,
    fileName
  };
};
