import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createJob, getAllJobs } from '../services/jobService';
import { getApplicationsByJob, updateApplicationStatus } from '../services/applicationService';
import { getCandidates, getRecruiterSummary, downloadCandidateResume } from '../services/authService';
import ApplicationCard from '../components/ApplicationCard';
import {
  Plus, Briefcase, Users, Search, Filter, Trophy, ChevronDown,
  Building2, MapPin, DollarSign, Target, TrendingUp, BarChart3,
  Award, Github, Linkedin, Code2, Zap,
  LayoutDashboard, FileText, Sparkles, UserCheck, LogOut
} from 'lucide-react';
import Loader from '../components/Loader';
import './RecruiterDashboard.css';

function RecruiterDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: user?.company || '',
    location: '',
    salary: '',
    requiredSkills: ''
  });
  const [loading, setLoading] = useState(false);
  const [postedJobs, setPostedJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [recruiterSummary, setRecruiterSummary] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    uniqueCandidates: 0,
    applicationsByJob: {}
  });
  const [updatingApplicationId, setUpdatingApplicationId] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [filters, setFilters] = useState({
    minScore: '',
    maxScore: '',
    skills: '',
    sortBy: 'score-desc'
  });

  useEffect(() => {
    loadPostedJobs();
    searchCandidates();
    loadRecruiterSummary();
  }, []);

  const loadRecruiterSummary = async () => {
    try {
      const summary = await getRecruiterSummary();
      setRecruiterSummary({
        totalApplications: summary?.totalApplications || 0,
        pendingApplications: summary?.pendingApplications || 0,
        acceptedApplications: summary?.acceptedApplications || 0,
        rejectedApplications: summary?.rejectedApplications || 0,
        uniqueCandidates: summary?.uniqueCandidates || 0,
        applicationsByJob: summary?.applicationsByJob || {}
      });
    } catch (error) {
      console.error('Error loading recruiter summary:', error);
    }
  };

  const loadPostedJobs = async () => {
    try {
      const jobs = await getAllJobs();
      setPostedJobs(jobs.filter(j => j.company === user?.company));
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.requiredSkills) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = formData.requiredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill);

      const jobData = {
        ...formData,
        company: formData.company || user?.company,
        requiredSkills: skillsArray
      };

      await createJob(jobData);
      await loadPostedJobs();

      setFormData({
        title: '',
        description: '',
        company: user?.company || '',
        location: '',
        salary: '',
        requiredSkills: ''
      });

      setShowPostModal(false);
      alert('Job posted successfully!');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (jobId) => {
    setSelectedJobId(jobId);
    setLoadingApplications(true);
    try {
      const data = await getApplicationsByJob(jobId);
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const navigateRecruiterView = (view) => {
    setActiveView(view);
    if (view === 'candidates') {
      searchCandidates();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const searchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const data = await getCandidates(filters);
      setCandidates(data);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleApplicationDecision = async (applicationId, status) => {
    setUpdatingApplicationId(applicationId);
    try {
      await updateApplicationStatus(applicationId, status);
      if (selectedJobId) {
        await loadApplications(selectedJobId);
      }
      await loadRecruiterSummary();
    } catch (error) {
      console.error('Error updating application status:', error);
      alert(error.response?.data?.message || 'Failed to update application status');
    } finally {
      setUpdatingApplicationId('');
    }
  };

  const handleResumeDownload = async (candidate) => {
    if (!candidate?.resumeFileName && candidate?.resumeCloudinaryUrl) {
      window.open(candidate.resumeCloudinaryUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const { blob, fileName } = await downloadCandidateResume(candidate._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || candidate.resumeFileName || candidate.resumeOriginalName || `${candidate.name || 'candidate'}-resume`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
      if (candidate?.resumeCloudinaryUrl) {
        window.open(candidate.resumeCloudinaryUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      alert(error.response?.data?.message || 'Failed to download resume file');
    }
  };

  const hasResume = (candidate) => {
    return Boolean(candidate?.resumeFileName || candidate?.resumeOriginalName || candidate?.resumeCloudinaryUrl);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#9fa7ff';
    if (score >= 55) return '#3adffa';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Strong';
    if (score >= 55) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Basic';
  };

  // Calculate stats
  const avgMatchScore = candidates.length > 0
    ? (candidates.reduce((acc, c) => acc + (c.resumeScore || 0), 0) / candidates.length).toFixed(1)
    : 0;

  // Score distribution for chart
  const scoreDistribution = [
    { range: '0-20', count: candidates.filter(c => c.resumeScore >= 0 && c.resumeScore < 20).length },
    { range: '20-40', count: candidates.filter(c => c.resumeScore >= 20 && c.resumeScore < 40).length },
    { range: '40-60', count: candidates.filter(c => c.resumeScore >= 40 && c.resumeScore < 60).length },
    { range: '60-80', count: candidates.filter(c => c.resumeScore >= 60 && c.resumeScore < 80).length },
    { range: '80-100', count: candidates.filter(c => c.resumeScore >= 80).length },
  ];
  const maxCount = Math.max(...scoreDistribution.map(d => d.count), 1);

  const filteredApplications = applicationStatusFilter === 'all'
    ? applications
    : applications.filter((application) => application.status === applicationStatusFilter);

  const selectedJobStatusCounts = applications.reduce((acc, application) => {
    const key = application.status || 'pending';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { pending: 0, accepted: 0, rejected: 0 });

  return (
    <div className="recruiter-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Sparkles size={24} />
          </div>
          <span className="logo-text">TalentAI</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => navigateRecruiterView('overview')}
          >
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </button>
          <button
            className={`nav-item ${activeView === 'candidates' ? 'active' : ''}`}
            onClick={() => navigateRecruiterView('candidates')}
          >
            <UserCheck size={20} />
            <span>Candidates</span>
          </button>
          <button
            className={`nav-item ${activeView === 'postings' ? 'active' : ''}`}
            onClick={() => navigateRecruiterView('postings')}
          >
            <FileText size={20} />
            <span>Postings</span>
            {postedJobs.length > 0 && <span className="nav-badge">{postedJobs.length}</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="ai-search-btn" onClick={() => setShowPostModal(true)}>
            <Zap size={18} />
            <span>New AI Search</span>
          </button>
          <button className="logout-sidebar-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <span className="header-label">INTELLIGENCE DASHBOARD</span>
            <h1>Recruitment Analytics</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowPostModal(true)}>
            <Plus size={18} />
            Post a New Job
          </button>
        </header>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">
              <Briefcase size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{postedJobs.length}</span>
              <span className="stat-label">Active Job Postings</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon cyan">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{recruiterSummary.totalApplications.toLocaleString()}</span>
              <span className="stat-label">Applications Received</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Target size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{recruiterSummary.pendingApplications.toLocaleString()}</span>
              <span className="stat-label">Pending Review</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{recruiterSummary.acceptedApplications.toLocaleString()}</span>
              <span className="stat-label">Accepted</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Filter size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{recruiterSummary.rejectedApplications.toLocaleString()}</span>
              <span className="stat-label">Rejected</span>
            </div>
          </div>
        </div>

        {/* Overview */}
        {activeView === 'overview' && (
        <div className="dashboard-grid">
          {/* Active Job Performance */}
          <div className="dashboard-card jobs-performance">
            <div className="card-header">
              <h2>Active Job Performance</h2>
              <button className="text-btn">View All</button>
            </div>
            <div className="jobs-list">
              {postedJobs.slice(0, 5).map((job, index) => (
                <div
                  key={job._id}
                  className={`job-item ${selectedJobId === job._id ? 'selected' : ''}`}
                  onClick={() => loadApplications(job._id)}
                >
                  <div className="job-item-info">
                    <h4>{job.title}</h4>
                    <span className="job-meta">{job.location || 'Remote'}</span>
                  </div>
                  <div className="job-item-stats">
                    <span className="applicant-count">
                      {recruiterSummary.applicationsByJob[String(job._id)] || 0}
                    </span>
                    <div className="mini-chart">
                      {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                        <div key={i} className="chart-bar" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {postedJobs.length === 0 && (
                <div className="empty-jobs">
                  <Briefcase size={32} />
                  <p>No active job postings</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowPostModal(true)}>
                    <Plus size={16} /> Create One
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Top Ranked Talent */}
            <div className="dashboard-card top-talent">
              <div className="card-header">
                <h2>Top Ranked Talent</h2>
                  <button className="text-btn" onClick={() => navigateRecruiterView('candidates')}>View All</button>
              </div>
              <div className="talent-list">
                {loadingCandidates ? (
                  <div className="loading-state">Loading...</div>
                ) : candidates.slice(0, 3).map((candidate, index) => (
                  <div key={candidate._id} className="talent-item">
                    <div className="talent-rank">#{index + 1}</div>
                    <div className="talent-avatar">
                      {candidate.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="talent-info">
                      <h4>{candidate.name}</h4>
                      <span>{candidate.experience || 'Developer'}</span>
                    </div>
                    {hasResume(candidate) && (
                      <button
                        type="button"
                        className="talent-resume-link"
                        onClick={() => handleResumeDownload(candidate)}
                        title={candidate.resumeFileName || candidate.resumeOriginalName || 'Download Resume'}
                        aria-label={`Download resume for ${candidate.name}`}
                      >
                        <FileText size={14} />
                      </button>
                    )}
                    <div className="talent-score" style={{ color: getScoreColor(candidate.resumeScore) }}>
                      {candidate.resumeScore || 0}
                    </div>
                  </div>
                ))}
                {!loadingCandidates && candidates.length === 0 && (
                  <div className="empty-talent">
                    <p>No candidates found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Score Distribution */}
            <div className="dashboard-card score-distribution">
              <div className="card-header">
                <h2>Applicant Score Distribution</h2>
              </div>
              <div className="distribution-chart">
                {scoreDistribution.map((item, index) => (
                  <div key={index} className="distribution-bar-container">
                    <div
                      className="distribution-bar"
                      style={{ height: `${(item.count / maxCount) * 100}%` }}
                    >
                      <span className="bar-value">{item.count}</span>
                    </div>
                    <span className="bar-label">{item.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Candidates */}
        {activeView === 'candidates' && (
          <div className="dashboard-card candidates-view-card">
            <div className="card-header">
              <h2>Candidate Pool</h2>
              <button className="btn btn-secondary btn-sm" onClick={searchCandidates}>
                <Search size={16} />
                Refresh
              </button>
            </div>

            <div className="candidate-filters-row">
              <input
                type="number"
                name="minScore"
                className="input"
                placeholder="Min Score"
                value={filters.minScore}
                onChange={handleFilterChange}
              />
              <input
                type="number"
                name="maxScore"
                className="input"
                placeholder="Max Score"
                value={filters.maxScore}
                onChange={handleFilterChange}
              />
              <input
                type="text"
                name="skills"
                className="input"
                placeholder="Skills (comma separated)"
                value={filters.skills}
                onChange={handleFilterChange}
              />
              <select
                name="sortBy"
                className="input"
                value={filters.sortBy}
                onChange={handleFilterChange}
              >
                <option value="score-desc">Score high to low</option>
                <option value="score-asc">Score low to high</option>
                <option value="name">Name</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={searchCandidates}>
                <Filter size={16} />
                Apply
              </button>
            </div>

            {loadingCandidates ? (
              <Loader message="Loading candidates..." />
            ) : candidates.length === 0 ? (
              <div className="empty-panel">
                <Users size={32} />
                <p>No candidates match your filters</p>
              </div>
            ) : (
              <div className="candidates-grid">
                {candidates.map((candidate) => (
                  <div key={candidate._id} className="candidate-card">
                    <div className="candidate-card-header">
                      <h4>{candidate.name}</h4>
                      <span className="candidate-score" style={{ color: getScoreColor(candidate.resumeScore || 0) }}>
                        {candidate.resumeScore || 0}
                      </span>
                    </div>
                    <p className="candidate-role">{candidate.experience || 'Candidate'}</p>

                    {hasResume(candidate) ? (
                      <button
                        type="button"
                        className="candidate-resume-link"
                        onClick={() => handleResumeDownload(candidate)}
                      >
                        <FileText size={14} />
                        <span>{candidate.resumeFileName || candidate.resumeOriginalName || 'View Resume'}</span>
                      </button>
                    ) : (
                      <p className="candidate-resume-missing">Resume file not uploaded</p>
                    )}

                    <div className="candidate-skills">
                      {(candidate.skills || []).slice(0, 6).map((skill, idx) => (
                        <span key={idx} className="skill-chip">{skill}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Postings */}
        {activeView === 'postings' && (
          <div className="dashboard-card postings-view-card">
            <div className="card-header">
              <h2>Job Postings</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowPostModal(true)}>
                <Plus size={16} />
                New Job
              </button>
            </div>

            <div className="jobs-list">
              {postedJobs.map((job) => (
                <div
                  key={job._id}
                  className={`job-item ${selectedJobId === job._id ? 'selected' : ''}`}
                  onClick={() => loadApplications(job._id)}
                >
                  <div className="job-item-info">
                    <h4>{job.title}</h4>
                    <span className="job-meta">{job.location || 'Remote'}</span>
                  </div>
                  <div className="job-item-stats">
                    <span className="applicant-count">
                      {recruiterSummary.applicationsByJob[String(job._id)] || 0}
                    </span>
                  </div>
                </div>
              ))}
              {postedJobs.length === 0 && (
                <div className="empty-jobs">
                  <Briefcase size={32} />
                  <p>No job postings yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Panel (shown when job selected) */}
        {selectedJobId && (activeView === 'overview' || activeView === 'postings') && (
          <div className="applications-panel">
            <div className="panel-header">
              <h3>
                <Users size={20} />
                Applicants for {postedJobs.find(j => j._id === selectedJobId)?.title}
              </h3>
              <button className="close-btn" onClick={() => setSelectedJobId(null)}>×</button>
            </div>

            <div className="application-status-filters">
              <button
                className={`status-filter-chip ${applicationStatusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setApplicationStatusFilter('all')}
              >
                All ({applications.length})
              </button>
              <button
                className={`status-filter-chip ${applicationStatusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setApplicationStatusFilter('pending')}
              >
                Pending ({selectedJobStatusCounts.pending || 0})
              </button>
              <button
                className={`status-filter-chip ${applicationStatusFilter === 'accepted' ? 'active' : ''}`}
                onClick={() => setApplicationStatusFilter('accepted')}
              >
                Accepted ({selectedJobStatusCounts.accepted || 0})
              </button>
              <button
                className={`status-filter-chip ${applicationStatusFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setApplicationStatusFilter('rejected')}
              >
                Rejected ({selectedJobStatusCounts.rejected || 0})
              </button>
            </div>

            {loadingApplications ? (
              <Loader message="Loading applicants..." />
            ) : filteredApplications.length > 0 ? (
              <div className="applications-grid">
                {filteredApplications.map((application) => (
                  <ApplicationCard
                    key={application._id}
                    application={application}
                    onResumeOpen={(app) => handleResumeDownload({
                      _id: app.candidateId,
                      name: app.candidateName,
                      resumeFileName: app.resumeFileName,
                      resumeOriginalName: app.resumeOriginalName,
                      resumeCloudinaryUrl: app.resumeCloudinaryUrl
                    })}
                    onDecision={handleApplicationDecision}
                    isUpdating={updatingApplicationId === application._id}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-panel">
                <Users size={32} />
                <p>No {applicationStatusFilter === 'all' ? '' : applicationStatusFilter} applications found</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <Zap size={28} />
              </div>
              <div>
                <h2>Create New Opportunity</h2>
                <p>Post a job to start receiving AI-matched candidates</p>
              </div>
              <button className="close-btn" onClick={() => setShowPostModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="job-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="title">
                    <Briefcase size={16} />
                    Job Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="input"
                    placeholder="e.g. Senior Frontend Developer"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company">
                    <Building2 size={16} />
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="input"
                    placeholder="e.g. Tech Corp"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">
                    <MapPin size={16} />
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="input"
                    placeholder="e.g. Remote, San Francisco"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="salary">
                    <DollarSign size={16} />
                    Salary Range
                  </label>
                  <input
                    type="text"
                    id="salary"
                    name="salary"
                    className="input"
                    placeholder="e.g. $100k - $150k"
                    value={formData.salary}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Job Description *</label>
                <textarea
                  id="description"
                  name="description"
                  className="textarea"
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="requiredSkills">Required Skills * (comma-separated)</label>
                <input
                  type="text"
                  id="requiredSkills"
                  name="requiredSkills"
                  className="input"
                  placeholder="e.g. React, Node.js, TypeScript, MongoDB"
                  value={formData.requiredSkills}
                  onChange={handleChange}
                  required
                />
                <span className="input-hint">These skills will be used for AI matching with candidates</span>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPostModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Plus size={18} />
                  {loading ? 'Creating...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterDashboard;
