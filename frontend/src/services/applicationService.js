import api from './api';

export const applyForJob = async (applicationData) => {
  const response = await api.post('/applications/apply', applicationData);
  return response.data.application;
};

export const getApplicationsByJob = async (jobId) => {
  const response = await api.get(`/applications/job/${jobId}`);
  return response.data.applications;
};

export const updateApplicationStatus = async (applicationId, status) => {
  const response = await api.patch(`/applications/${applicationId}/status`, {
    status
  });
  return response.data.application;
};

export const getMyApplicationSummary = async () => {
  const response = await api.get('/applications/my/summary');
  return response.data.summary;
};
