import { useState, useEffect } from 'react';
import { getAllJobs, searchJobs } from '../services/jobService';

export const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllJobs();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchJobsWithSkills = async (query, skills) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchJobs(query, skills);
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return { jobs, loading, error, loadJobs, searchJobsWithSkills };
};
