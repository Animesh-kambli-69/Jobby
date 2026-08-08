import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById } from '../services/jobService';
import { applyForJob } from '../services/applicationService';
import { useAuth } from '../context/AuthContext';
import { Briefcase, MapPin, DollarSign, Clock, ArrowLeft, Send, Sparkles } from 'lucide-react';
import Loader from '../components/Loader';
import './JobDetails.css';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    setLoading(true);
    try {
      const data = await getJobById(id);
      setJob(data);
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      alert('Please login first.');
      navigate('/login');
      return;
    }

    if (!user.name?.trim()) {
      navigate('/profile', {
        state: {
          missingField: 'name',
          message: 'Please complete your profile name before applying.'
        }
      });
      return;
    }

    if (!user.email?.trim()) {
      navigate('/profile', {
        state: {
          missingField: 'email',
          message: 'Please add your email before applying.'
        }
      });
      return;
    }

    const hasResume = Boolean(user.resume || user.resumeOriginalName);
    if (!hasResume) {
      navigate('/profile', {
        state: {
          missingField: 'resume',
          message: 'Please upload your resume first before applying.'
        }
      });
      return;
    }

    if (!Array.isArray(user.skills) || user.skills.length === 0) {
      navigate('/profile', {
        state: {
          missingField: 'skills',
          message: 'Please parse your resume to extract skills before applying.'
        }
      });
      return;
    }

    setApplying(true);
    try {
      await applyForJob({
        jobId: id,
        candidateName: user.name,
        candidateEmail: user.email,
        candidateSkills: user.skills,
        resume: user.resume || ''
      });
      setApplied(true);
    } catch (error) {
      console.error('Error applying:', error);
      const errorMessage = error?.response?.data?.message || error?.message || '';

      if (errorMessage.toLowerCase().includes('already applied')) {
        setApplied(true);
        alert('You have already applied for this job.');
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <Loader message="Loading job details..." />;
  }

  if (!job) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Job not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/candidate')}>
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate('/candidate')}>
          <ArrowLeft size={18} />
          <span>Back to Jobs</span>
        </button>

        <div className="job-details-container">
          <div className="job-main glass-card">
            <div className="job-header-section">
              <div className="job-header-content">
                <h1 className="job-details-title">{job.title}</h1>
                <div className="job-meta-info">
                  <span className="meta-item">
                    <Briefcase size={18} />
                    {job.company}
                  </span>
                  <span className="meta-item">
                    <MapPin size={18} />
                    {job.location}
                  </span>
                  {job.salary && (
                    <span className="meta-item">
                      <DollarSign size={18} />
                      {job.salary}
                    </span>
                  )}
                  <span className="meta-item">
                    <Clock size={18} />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="job-section">
              <h2 className="section-title">Job Description</h2>
              <p className="job-description-full">{job.description}</p>
            </div>

            <div className="job-section">
              <h2 className="section-title">Required Skills</h2>
              <div className="skills-grid">
                {job.requiredSkills.map((skill, index) => (
                  <div key={index} className="skill-item">
                    <Sparkles size={16} />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="job-sidebar">
            <div className="apply-card glass-card">
              <h3 className="apply-title">Ready to Apply?</h3>
              <p className="apply-description">
                Join our team and make an impact. We review applications daily.
              </p>

              {applied ? (
                <div className="success-card">
                  <Send size={32} />
                  <h4>Application Submitted!</h4>
                  <p>We'll review your profile and get back to you soon.</p>
                </div>
              ) : (
                <button
                  className="btn btn-primary apply-btn-main"
                  onClick={handleApply}
                  disabled={applying}
                >
                  <Send size={18} />
                  {applying ? 'Submitting...' : 'Apply Now'}
                </button>
              )}
            </div>

            <div className="info-card glass-card">
              <h3 className="info-title">About this role</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value active">Active</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Job Type</span>
                  <span className="info-value">Full-time</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Level</span>
                  <span className="info-value">Mid-Senior</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;
