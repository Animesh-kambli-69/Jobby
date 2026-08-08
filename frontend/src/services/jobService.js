import api from './api';

export const createJob = async (jobData) => {
  const response = await api.post('/jobs/create', jobData);
  return response.data.job;
};

export const searchJobs = async (query, candidateSkills = []) => {
  const response = await api.post('/jobs/search', {
    query,
    candidateSkills
  });
  return response.data.jobs;
};

export const searchJobsByTitle = async (title, candidateSkills = []) => {
  const response = await api.post('/jobs/search', {
    query: title,
    candidateSkills,
    searchByTitle: true
  });
  return response.data.jobs;
};

export const getJobById = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data.job;
};

export const getAllJobs = async () => {
  const response = await api.get('/jobs/all');
  return response.data.jobs;
};
