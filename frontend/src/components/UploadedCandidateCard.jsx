import { Trophy, Sparkles } from 'lucide-react';
import './UploadedCandidateCard.css';

function UploadedCandidateCard({ candidate }) {
  if (!candidate) {
    return null;
  }

  const topSkills = Array.isArray(candidate.skills)
    ? candidate.skills.slice(0, 10)
    : [];

  return (
    <div className="uploaded-candidate-card">
      <div className="uploaded-candidate-card-header">
        <div>
          <h3>Candidate Card Preview</h3>
          <p>Generated from your latest uploaded resume</p>
        </div>
        {typeof candidate.resumeScore === 'number' && (
          <div className="uploaded-candidate-score">
            <Trophy size={18} />
            <span>{candidate.resumeScore}</span>
          </div>
        )}
      </div>

      <div className="uploaded-candidate-identity">
        <strong>{candidate.name || 'Candidate'}</strong>
        <span>{candidate.email || ''}</span>
      </div>

      <div className="uploaded-candidate-skills">
        <div className="skills-title">
          <Sparkles size={16} />
          <span>Extracted Skills</span>
        </div>
        {topSkills.length > 0 ? (
          <div className="skills-list">
            {topSkills.map((skill, index) => (
              <span key={`${skill}-${index}`} className="skill-pill">{skill}</span>
            ))}
          </div>
        ) : (
          <p className="no-skills">No skills were detected yet.</p>
        )}
      </div>
    </div>
  );
}

export default UploadedCandidateCard;
