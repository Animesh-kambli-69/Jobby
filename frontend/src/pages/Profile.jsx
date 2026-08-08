import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, FileText, Sparkles, Upload, Github, Linkedin, Code2, Globe, Trophy, Zap, Award, BookOpen } from 'lucide-react';
import Loader from '../components/Loader';
import UploadedCandidateCard from '../components/UploadedCandidateCard';
import './Profile.css';

function Profile() {
  const location = useLocation();
  const { user, updateUserProfile } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [inputMode, setInputMode] = useState('file');
  const [loading, setLoading] = useState(false);
  const [uploadedCandidate, setUploadedCandidate] = useState(null);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [profileGuidance, setProfileGuidance] = useState('');
  const [requiredField, setRequiredField] = useState('');
  const toastTimerRef = useRef(null);
  const resumeSectionRef = useRef(null);
  const [profileLinks, setProfileLinks] = useState({
    github: '',
    linkedin: '',
    leetcode: '',
    portfolio: ''
  });

  useEffect(() => {
    if (user?.profileLinks) {
      setProfileLinks({
        github: user.profileLinks.github || '',
        linkedin: user.profileLinks.linkedin || '',
        leetcode: user.profileLinks.leetcode || '',
        portfolio: user.profileLinks.portfolio || ''
      });
    }
    if (user?.resume) {
      setResumeText(user.resume);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const state = location.state || {};
    if (!state.missingField) {
      return;
    }

    setRequiredField(state.missingField);
    setProfileGuidance(state.message || 'Please complete required profile details before applying.');

    if (state.missingField === 'resume' || state.missingField === 'skills') {
      setInputMode('file');
      setTimeout(() => {
        resumeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [location.state]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleLinkChange = (e) => {
    setProfileLinks({
      ...profileLinks,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async () => {
    const isFileUpload = inputMode === 'file';

    if (inputMode === 'file' && !resumeFile) {
      alert('Please select a resume file');
      return;
    }

    if (inputMode === 'text' && !resumeText.trim()) {
      alert('Please enter your resume text');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      if (inputMode === 'file') {
        formData.append('resume', resumeFile);
      } else {
        formData.append('resumeText', resumeText);
      }

      formData.append('profileLinks', JSON.stringify(profileLinks));

      const updatedUser = await updateUserProfile(formData);

      setUploadedCandidate(isFileUpload ? updatedUser : null);
      setShowUploadSuccess(true);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        setShowUploadSuccess(false);
      }, 2800);

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    // Cognitive Curator Design System Colors
    if (score >= 85) return '#10b981';  // Success green
    if (score >= 70) return '#9fa7ff';  // Primary indigo
    if (score >= 55) return '#3adffa';  // Secondary cyan
    if (score >= 40) return '#f59e0b';  // Warning
    return '#ef4444';                   // Error
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Very Good';
    if (score >= 55) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };

  const programmingLanguages = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Dart',
    'C', 'Objective-C', 'Shell', 'Bash', 'PowerShell', 'SQL', 'HTML', 'CSS'
  ];

  const frameworks = [
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'Spring Boot', '.NET', 'Laravel', 'Rails', 'Next.js', 'Nuxt', 'Svelte',
    'FastAPI', 'NestJS', 'Gin', 'Echo', 'Fiber'
  ];

  const userLanguages = user?.skills?.filter(skill =>
    programmingLanguages.some(lang => skill.toLowerCase().includes(lang.toLowerCase()))
  ) || [];

  const userFrameworks = user?.skills?.filter(skill =>
    frameworks.some(fw => skill.toLowerCase().includes(fw.toLowerCase()))
  ) || [];

  const otherSkills = user?.skills?.filter(skill =>
    !userLanguages.includes(skill) && !userFrameworks.includes(skill)
  ) || [];

  const uploadedResumeLabel = resumeFile
    ? resumeFile.name
    : user?.resumeOriginalName || 'Click to select a resume file';

  const uploadedResumeMeta = user?.resumeUploadedAt
    ? `Last uploaded: ${new Date(user.resumeUploadedAt).toLocaleString()}`
    : 'Supports PDF, TXT, DOC, DOCX (Max 5MB)';

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1 className="profile-title">
            <User className="title-icon" />
            Your Profile
          </h1>
          <p className="profile-subtitle">
            Your professional profile card - visible to recruiters when you apply
          </p>
        </div>

        <div className="profile-content">
          {/* Candidate Card */}
          <div className="candidate-profile-card glass-card">
            <div className="card-header">
              <div className="card-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="card-user-info">
                <h2>{user?.name || 'Your Name'}</h2>
                <p>{user?.email}</p>
                {user?.experience && <span className="experience-badge">{user.experience}</span>}
              </div>
              {user?.resumeScore > 0 && (
                <div className="card-score" style={{ borderColor: getScoreColor(user.resumeScore) }}>
                  <Trophy size={24} style={{ color: getScoreColor(user.resumeScore) }} />
                  <div className="score-details">
                    <span className="score-value" style={{ color: getScoreColor(user.resumeScore) }}>
                      {user.resumeScore}
                    </span>
                    <span className="score-label">{getScoreLabel(user.resumeScore)}</span>
                  </div>
                </div>
              )}
            </div>

            {user?.summary && (
              <div className="card-summary">
                <p>{user.summary}</p>
              </div>
            )}

            <div className="card-sections">
              {userLanguages.length > 0 && (
                <div className="card-section">
                  <div className="section-label">
                    <Zap size={16} />
                    <span>Programming Languages</span>
                  </div>
                  <div className="section-tags">
                    {userLanguages.map((lang, i) => (
                      <span key={i} className="tag language-tag">{lang}</span>
                    ))}
                  </div>
                </div>
              )}

              {userFrameworks.length > 0 && (
                <div className="card-section">
                  <div className="section-label">
                    <BookOpen size={16} />
                    <span>Frameworks & Libraries</span>
                  </div>
                  <div className="section-tags">
                    {userFrameworks.map((fw, i) => (
                      <span key={i} className="tag framework-tag">{fw}</span>
                    ))}
                  </div>
                </div>
              )}

              {otherSkills.length > 0 && (
                <div className="card-section">
                  <div className="section-label">
                    <Award size={16} />
                    <span>Other Skills</span>
                  </div>
                  <div className="section-tags">
                    {otherSkills.map((skill, i) => (
                      <span key={i} className="tag skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {user?.education && (
                <div className="card-section">
                  <div className="section-label">
                    <BookOpen size={16} />
                    <span>Education</span>
                  </div>
                  <p className="education-text">{user.education}</p>
                </div>
              )}
            </div>

            <div className="card-links">
              {user?.profileLinks?.github && (
                <a href={user.profileLinks.github} target="_blank" rel="noopener noreferrer" className="profile-link">
                  <Github size={18} />
                  GitHub
                </a>
              )}
              {user?.profileLinks?.linkedin && (
                <a href={user.profileLinks.linkedin} target="_blank" rel="noopener noreferrer" className="profile-link">
                  <Linkedin size={18} />
                  LinkedIn
                </a>
              )}
              {user?.profileLinks?.leetcode && (
                <a href={user.profileLinks.leetcode} target="_blank" rel="noopener noreferrer" className="profile-link">
                  <Code2 size={18} />
                  LeetCode
                </a>
              )}
              {user?.profileLinks?.portfolio && (
                <a href={user.profileLinks.portfolio} target="_blank" rel="noopener noreferrer" className="profile-link">
                  <Globe size={18} />
                  Portfolio
                </a>
              )}
            </div>
          </div>

          {/* Profile Links Section */}
          <div className="profile-links-section glass-card">
            <div className="section-header">
              <Globe size={24} className="section-icon" />
              <h2>Profile Links</h2>
            </div>

            <div className="links-grid">
              <div className="link-field">
                <label>
                  <Github size={18} />
                  GitHub
                </label>
                <input
                  type="url"
                  name="github"
                  value={profileLinks.github}
                  onChange={handleLinkChange}
                  placeholder="https://github.com/username"
                />
              </div>

              <div className="link-field">
                <label>
                  <Linkedin size={18} />
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={profileLinks.linkedin}
                  onChange={handleLinkChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="link-field">
                <label>
                  <Code2 size={18} />
                  LeetCode
                </label>
                <input
                  type="url"
                  name="leetcode"
                  value={profileLinks.leetcode}
                  onChange={handleLinkChange}
                  placeholder="https://leetcode.com/username"
                />
              </div>

              <div className="link-field">
                <label>
                  <Globe size={18} />
                  Portfolio
                </label>
                <input
                  type="url"
                  name="portfolio"
                  value={profileLinks.portfolio}
                  onChange={handleLinkChange}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
          </div>

          {profileGuidance && (
            <div className="profile-guidance-banner" role="alert">
              {profileGuidance}
            </div>
          )}

          {/* Upload/Update Resume Section */}
          <div
            ref={resumeSectionRef}
            className={`resume-section glass-card ${requiredField === 'resume' || requiredField === 'skills' ? 'required-attention' : ''}`}
          >
            <div className="section-header">
              <Upload size={24} className="section-icon" />
              <h2>{user?.resume ? 'Update Resume' : 'Upload Resume'}</h2>
            </div>

            <div className="input-mode-toggle">
              <button
                className={`mode-btn ${inputMode === 'file' ? 'active' : ''}`}
                onClick={() => setInputMode('file')}
              >
                <Upload size={16} />
                Upload File
              </button>
              <button
                className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                onClick={() => setInputMode('text')}
              >
                <FileText size={16} />
                Paste Text
              </button>
            </div>

            {inputMode === 'file' ? (
              <div className="file-upload-container">
                <label className="file-upload-label">
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <div className="file-upload-box">
                    <Upload size={48} className="upload-icon" />
                    <p className="upload-text">
                      {uploadedResumeLabel}
                    </p>
                    <p className="upload-hint">
                      {uploadedResumeMeta}
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <textarea
                className="textarea"
                placeholder="Paste your resume here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            )}

            <button
              className="btn btn-primary parse-btn"
              onClick={handleUpdateProfile}
              disabled={loading}
            >
              <Sparkles size={18} />
              {loading ? 'Updating Profile...' : 'Update Profile & Parse Resume'}
            </button>

            {showUploadSuccess && (
              <div className="upload-success-toast" role="status" aria-live="polite">
                Resume parsed successfully. Skills have been extracted.
              </div>
            )}

            {inputMode === 'file' && uploadedCandidate && (
              <UploadedCandidateCard candidate={uploadedCandidate} />
            )}
          </div>

          {loading && <Loader message="Analyzing your resume with Groq AI..." />}
        </div>
      </div>
    </div>
  );
}

export default Profile;
