import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import JobCard from '../components/JobCard';
import Loader from '../components/Loader';
import { searchJobs, searchJobsByTitle } from '../services/jobService';
import { getMyApplicationSummary } from '../services/applicationService';
import {
  Sparkles, Briefcase, Trophy, Network, Target, Filter,
  SlidersHorizontal, MapPin, DollarSign, Clock, Zap,
  Brain, FileText, MessageSquare, ArrowRight, TrendingUp
} from 'lucide-react';
import './CandidateDashboard.css';

function CandidateDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [applicationSummary, setApplicationSummary] = useState({
    applied: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    salary: '',
    experience: ''
  });

  useEffect(() => {
    loadJobs();
    loadApplicationSummary();
  }, [user]);

  const loadApplicationSummary = async () => {
    try {
      const summary = await getMyApplicationSummary();
      setApplicationSummary({
        applied: Number(summary?.applied || 0),
        rejected: Number(summary?.rejected || 0)
      });
    } catch (error) {
      console.error('Error loading application summary:', error);
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const skills = user?.skills || [];
      const data = await searchJobs('', skills);
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let data;
      if (searchQuery.trim()) {
        data = await searchJobsByTitle(searchQuery, user?.skills || []);
      } else {
        data = await searchJobs('', user?.skills || []);
      }
      setJobs(data);
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#6b7280';
  };

  const quickActions = [
    { icon: FileText, label: 'My Profile', path: '/profile', color: 'violet' },
    { icon: Briefcase, label: 'Applications', path: '/applications', color: 'cyan' },
    { icon: Brain, label: 'AI Interview', path: '/interview', color: 'green' },
  ];

  return (
    <div className="candidate-dashboard">
      <div className="container">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="hero-content">
            <div className="welcome-badge">
              <Network size={16} />
              <span>Opportunity Graph</span>
            </div>
            <h1 className="dashboard-title">
              Welcome back, <span className="gradient-name">{user?.name?.split(' ')[0] || 'Candidate'}</span>
            </h1>
            <p className="dashboard-subtitle">
              Discover AI-matched opportunities in your personalized job network
            </p>
          </div>

          <div className="hero-stats">
            {user?.resumeScore > 0 && (
              <div className="stat-card glass-card">
                <Trophy size={28} style={{ color: getScoreColor(user.resumeScore) }} />
                <div className="stat-info">
                  <span className="stat-value" style={{ color: getScoreColor(user.resumeScore) }}>
                    {user.resumeScore}
                  </span>
                  <span className="stat-label">Resume Score</span>
                </div>
              </div>
            )}

            <div className="stat-card glass-card">
              <Target size={28} className="stat-icon-cyan" />
              <div className="stat-info">
                <span className="stat-value">{jobs.length}</span>
                <span className="stat-label">Matched Jobs</span>
              </div>
            </div>

            <div className="stat-card glass-card">
              <Briefcase size={28} className="stat-icon-cyan" />
              <div className="stat-info">
                <span className="stat-value">{applicationSummary.applied}</span>
                <span className="stat-label">Applied Jobs</span>
              </div>
            </div>

            <div className="stat-card glass-card">
              <Filter size={28} className="stat-icon-cyan" />
              <div className="stat-info">
                <span className="stat-value">{applicationSummary.rejected}</span>
                <span className="stat-label">Rejected Jobs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.path} className={`action-card glass-card action-${action.color}`}>
              <action.icon size={24} />
              <span>{action.label}</span>
              <ArrowRight size={18} className="action-arrow" />
            </Link>
          ))}
        </div>

        {/* Skills Preview */}
        {user?.skills?.length > 0 && (
          <div className="skills-section glass-card">
            <div className="skills-header">
              <Sparkles size={20} className="skills-icon" />
              <span className="skills-title">Your Skills Graph</span>
              <Link to="/profile" className="skills-edit">Edit Skills</Link>
            </div>
            <div className="skills-grid">
              {user.skills.slice(0, 8).map((skill, index) => (
                <span key={index} className="skill-chip">{skill}</span>
              ))}
              {user.skills.length > 8 && (
                <span className="skill-chip more">+{user.skills.length - 8} more</span>
              )}
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="search-section">
          <div className="search-header">
            <h2>
              <Zap size={24} className="section-icon" />
              Adaptive Job Search
            </h2>
            <button
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>
          </div>

          <div className="search-bar-wrapper">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search by job title, company, or keywords..."
            />
          </div>

          {showFilters && (
            <div className="filters-panel glass-card">
              <div className="filter-group">
                <label><MapPin size={16} /> Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                >
                  <option value="">Any Location</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              <div className="filter-group">
                <label><Clock size={16} /> Job Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div className="filter-group">
                <label><DollarSign size={16} /> Salary Range</label>
                <select
                  value={filters.salary}
                  onChange={(e) => setFilters({ ...filters, salary: e.target.value })}
                >
                  <option value="">Any Salary</option>
                  <option value="50k-80k">$50K - $80K</option>
                  <option value="80k-120k">$80K - $120K</option>
                  <option value="120k-160k">$120K - $160K</option>
                  <option value="160k+">$160K+</option>
                </select>
              </div>

              <div className="filter-group">
                <label><TrendingUp size={16} /> Experience</label>
                <select
                  value={filters.experience}
                  onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                >
                  <option value="">Any Level</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead / Manager</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {loading ? (
          <Loader message="Analyzing your graph connections..." />
        ) : jobs.length > 0 ? (
          <div className="results-section">
            <div className="results-header">
              <h2 className="results-title">
                <Network size={22} />
                {user?.skills?.length > 0 ? 'AI-Matched Opportunities' : 'All Opportunities'}
              </h2>
              <span className="results-count">{jobs.length} connections found</span>
            </div>
            <div className="jobs-grid">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state glass-card">
            <div className="empty-icon">
              <Briefcase size={48} />
            </div>
            <h3>No Opportunities Found</h3>
            <p>Try adjusting your search or filters to discover more connections</p>
            <button className="btn btn-primary" onClick={loadJobs}>
              <Sparkles size={18} />
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateDashboard;
