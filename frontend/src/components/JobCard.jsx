import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Clock, TrendingUp } from 'lucide-react';
import './JobCard.css';

function JobCard({ job }) {
  const navigate = useNavigate();

  const getMatchScoreClass = (score) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const formatDate = (date) => {
    const now = new Date();
    const jobDate = new Date(date);
    const diffTime = Math.abs(now - jobDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return jobDate.toLocaleDateString();
  };

  return (
    <div className="job-card glass-card" onClick={() => navigate(`/job/${job._id}`)}>
      <div className="job-card-header">
        <div className="job-title-section">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
        </div>

        {job.matchScore > 0 && (
          <div className={`match-score ${getMatchScoreClass(job.matchScore)}`}>
            <TrendingUp size={16} />
            <span>{job.matchScore}% Match</span>
          </div>
        )}
      </div>

      <p className="job-description">{job.description.substring(0, 120)}...</p>

      <div className="job-skills">
        {job.requiredSkills.slice(0, 4).map((skill, index) => (
          <span key={index} className="skill-badge">{skill}</span>
        ))}
        {job.requiredSkills.length > 4 && (
          <span className="skill-badge more">+{job.requiredSkills.length - 4}</span>
        )}
      </div>

      <div className="job-card-footer">
        <div className="job-meta">
          <span className="meta-item">
            <MapPin size={14} />
            {job.location}
          </span>
          <span className="meta-item">
            <Clock size={14} />
            {formatDate(job.createdAt)}
          </span>
        </div>
        {job.salary && (
          <span className="job-salary">{job.salary}</span>
        )}
      </div>
    </div>
  );
}

export default JobCard;
