import api from './api';

export const getInterviewQuestions = async ({ interviewType, difficulty }) => {
  const response = await api.get('/interview/questions', {
    params: { interviewType, difficulty }
  });
  return response.data;
};

export const analyzeInterview = async (payload) => {
  const response = await api.post('/interview/analyze', payload);
  return response.data;
};

export const uploadInterviewRecording = async ({ videoFile, interviewType, duration }) => {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('interviewType', interviewType);
  formData.append('duration', String(duration || 0));

  const response = await api.post('/interview/recordings', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export const evaluateInterviewPerformance = async ({ interviewType, difficulty, qaPairs, metrics, totalDurationSeconds }) => {
  const response = await api.post('/interview/performance', {
    interviewType,
    difficulty,
    qaPairs,
    metrics,
    totalDurationSeconds
  });
  return response.data;
};
