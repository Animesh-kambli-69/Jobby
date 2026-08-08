import { Mail, Award, CheckCircle2, FileText } from 'lucide-react';
import './ApplicationCard.css';

function ApplicationCard({ application, onDecision, onResumeOpen, isUpdating }) {
  const getMatchScoreClass = (score) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      reviewed: '#06b6d4',
      accepted: '#10b981',
      rejected: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="application-card glass-card">
      <div className="application-header">
        <div className="candidate-info">
          <h3 className="candidate-name">{application.candidateName}</h3>
          <div className="candidate-email">
            <Mail size={14} />
            <span className="candidate-email-text">{application.candidateEmail}</span>
          </div>
        </div>

        <div className={`match-score ${getMatchScoreClass(application.matchScore)}`}>
          <Award size={16} className="match-score-icon" />
          <span className="match-score-text">{application.matchScore}% Match</span>
        </div>
      </div>

      <div className="application-skills">
        {application.candidateSkills.map((skill, index) => (
          <span key={index} className="skill-badge">{skill}</span>
        ))}
      </div>

      {(application.resumeFileName || application.resumeOriginalName || application.resumeCloudinaryUrl) && (
        <button
          type="button"
          className="application-resume-link"
          onClick={() => onResumeOpen?.(application)}
        >
          <FileText size={14} />
          <span>{application.resumeFileName || application.resumeOriginalName || 'View Resume'}</span>
        </button>
      )}

      <div className="application-footer">
        <div
          className="status-badge"
          style={{
            background: `${getStatusColor(application.status)}20`,
            color: getStatusColor(application.status),
            borderColor: `${getStatusColor(application.status)}40`
          }}
        >
          <CheckCircle2 size={14} />
          <span>{application.status.toUpperCase()}</span>
        </div>

        <span className="application-date">
          {new Date(application.appliedAt).toLocaleDateString()}
        </span>
      </div>

      {onDecision && (
        <div className="application-actions">
          <button
            type="button"
            className="decision-btn accept"
            disabled={isUpdating || application.status === 'accepted'}
            onClick={() => onDecision(application._id, 'accepted')}
          >
            {isUpdating ? 'Updating...' : 'Accept'}
          </button>
          <button
            type="button"
            className="decision-btn reject"
            disabled={isUpdating || application.status === 'rejected'}
            onClick={() => onDecision(application._id, 'rejected')}
          >
            {isUpdating ? 'Updating...' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ApplicationCard;
