import { useState } from 'react';
import { getApplicationsByJob } from '../services/applicationService';

export const useApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadApplications = async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getApplicationsByJob(jobId);
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { applications, loading, error, loadApplications };
};
