import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase, Clock, CheckCircle, XCircle, AlertCircle,
  MapPin, DollarSign, Building2, Calendar, ArrowRight,
  Filter, Search, TrendingUp, Eye, MessageSquare, Network
} from 'lucide-react';
import './Applications.css';

function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/applications/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applied': return <Clock size={18} />;
      case 'reviewing': return <Eye size={18} />;
      case 'interview': return <MessageSquare size={18} />;
      case 'accepted': return <CheckCircle size={18} />;
      case 'rejected': return <XCircle size={18} />;
      default: return <AlertCircle size={18} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'applied': return 'status-applied';
      case 'reviewing': return 'status-reviewing';
      case 'interview': return 'status-interview';
      case 'accepted': return 'status-accepted';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    interview: applications.filter(a => a.status === 'interview').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="applications-page">
        <div className="container">
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading your application graph...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <div className="container">
        <div className="applications-header">
          <div className="header-content">
            <div className="header-badge">
              <Network size={16} />
              <span>Application Graph</span>
            </div>
            <h1>Your Applications</h1>
            <p>Track and manage your job application relationships</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-icon total">
              <Briefcase size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Applications</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon applied">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.applied}</span>
              <span className="stat-label">Applied</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon reviewing">
              <Eye size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.reviewing}</span>
              <span className="stat-label">In Review</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon interview">
              <MessageSquare size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.interview}</span>
              <span className="stat-label">Interview</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon accepted">
              <CheckCircle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.accepted}</span>
              <span className="stat-label">Accepted</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="applications-controls glass-card">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-tab ${filter === 'applied' ? 'active' : ''}`}
              onClick={() => setFilter('applied')}
            >
              Applied
            </button>
            <button
              className={`filter-tab ${filter === 'reviewing' ? 'active' : ''}`}
              onClick={() => setFilter('reviewing')}
            >
              Reviewing
            </button>
            <button
              className={`filter-tab ${filter === 'interview' ? 'active' : ''}`}
              onClick={() => setFilter('interview')}
            >
              Interview
            </button>
            <button
              className={`filter-tab ${filter === 'accepted' ? 'active' : ''}`}
              onClick={() => setFilter('accepted')}
            >
              Accepted
            </button>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="applications-list">
            {filteredApplications.map((app) => (
              <div key={app._id} className="application-card glass-card">
                <div className="app-main">
                  <div className="app-company-logo">
                    <Building2 size={28} />
                  </div>
                  <div className="app-details">
                    <h3>{app.job?.title || 'Position'}</h3>
                    <p className="app-company">{app.job?.company || 'Company'}</p>
                    <div className="app-meta">
                      <span><MapPin size={14} /> {app.job?.location || 'Remote'}</span>
                      <span><DollarSign size={14} /> {app.job?.salary || 'Competitive'}</span>
                      <span><Calendar size={14} /> Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="app-status-section">
                  <div className={`app-status ${getStatusClass(app.status)}`}>
                    {getStatusIcon(app.status)}
                    <span>{app.status}</span>
                  </div>

                  {app.matchScore && (
                    <div className="match-score">
                      <TrendingUp size={16} />
                      <span>{app.matchScore}% Match</span>
                    </div>
                  )}
                </div>

                <div className="app-timeline">
                  <div className={`timeline-step ${app.status === 'applied' || app.status === 'reviewing' || app.status === 'interview' || app.status === 'accepted' ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <span>Applied</span>
                  </div>
                  <div className="timeline-line"></div>
                  <div className={`timeline-step ${app.status === 'reviewing' || app.status === 'interview' || app.status === 'accepted' ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <span>Review</span>
                  </div>
                  <div className="timeline-line"></div>
                  <div className={`timeline-step ${app.status === 'interview' || app.status === 'accepted' ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <span>Interview</span>
                  </div>
                  <div className="timeline-line"></div>
                  <div className={`timeline-step ${app.status === 'accepted' ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <span>Offer</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state glass-card">
            <Briefcase size={64} />
            <h3>No Applications Yet</h3>
            <p>Start applying to jobs to build your application graph</p>
            <Link to="/jobs" className="btn btn-primary">
              Browse Jobs
              <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Applications;
