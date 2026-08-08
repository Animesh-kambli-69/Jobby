import api from './api';

export const parseResume = async (input, mode = 'text') => {
  if (mode === 'file') {
    const formData = new FormData();
    formData.append('resume', input);

    const response = await api.post('/profile/parse-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.profile;
  } else {
    const response = await api.post('/profile/parse-resume', {
      resumeText: input
    });
    return response.data.profile;
  }
};
