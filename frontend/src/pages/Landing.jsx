import { Link } from 'react-router-dom';
import { Briefcase, Users, Sparkles, TrendingUp, CheckCircle, ArrowRight, Network, Target, Brain, Zap, LineChart, GitBranch } from 'lucide-react';
import './Landing.css';

function Landing() {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <Network size={16} />
              <span>Opportunity Graph Ecosystem</span>
            </div>
            <h1 className="hero-title">
              Transform Job Discovery into an <span className="gradient-text">Intelligent Network</span>
            </h1>
            <p className="hero-subtitle">
              JobGraph isn't just a listing board—it's a connected opportunity ecosystem. Experience intelligent matchmaking through graph-based relationships, adaptive search, and AI-powered insights.
            </p>
            <div className="hero-buttons">
              <Link to="/signup?role=candidate" className="btn btn-primary btn-large">
                <Users size={20} />
                Join as Candidate
              </Link>
              <Link to="/signup?role=recruiter" className="btn btn-secondary btn-large">
                <Briefcase size={20} />
                Join as Recruiter
              </Link>
            </div>
            <p className="hero-note">
              Already part of the network? <Link to="/login" className="link-accent">Access Dashboard</Link>
            </p>
          </div>

          <div className="hero-visual">
            <div className="graph-node node-1">
              <Briefcase size={24} />
            </div>
            <div className="graph-node node-2">
              <Users size={24} />
            </div>
            <div className="graph-node node-3">
              <Target size={24} />
            </div>
            <div className="graph-connection conn-1"></div>
            <div className="graph-connection conn-2"></div>
            <div className="graph-connection conn-3"></div>
          </div>
        </div>
      </section>

      <section className="problem-section">
        <div className="container">
          <div className="problem-box glass-card">
            <h2>The Problem with Traditional Job Boards</h2>
            <div className="problem-grid">
              <div className="problem-item">
                <span className="problem-icon">❌</span>
                <p>Inefficient opportunity discovery</p>
              </div>
              <div className="problem-item">
                <span className="problem-icon">❌</span>
                <p>No structured application traceability</p>
              </div>
              <div className="problem-item">
                <span className="problem-icon">❌</span>
                <p>Shallow search systems</p>
              </div>
              <div className="problem-item">
                <span className="problem-icon">❌</span>
                <p>Disconnected silos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="solution-section">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">Our Solution: The Opportunity Graph</h2>
            <p className="section-subtitle">
              Four core systems working together to transform job matching
            </p>
          </div>

          <div className="solution-grid">
            <div className="solution-card glass-card">
              <div className="solution-icon">
                <GitBranch size={40} />
              </div>
              <h3>Opportunity Registry</h3>
              <p>Structured job entities with rich metadata, skills mapping, and relationship tracking across the entire ecosystem</p>
              <div className="solution-badge">Core System</div>
            </div>

            <div className="solution-card glass-card">
              <div className="solution-icon">
                <Network size={40} />
              </div>
              <h3>Application Graph Engine</h3>
              <p>Map candidate-job relationships as a queryable graph with full traceability and interaction history</p>
              <div className="solution-badge">Core System</div>
            </div>

            <div className="solution-card glass-card">
              <div className="solution-icon">
                <Brain size={40} />
              </div>
              <h3>Adaptive Search Layer</h3>
              <p>Context-aware, intelligent search that learns from behavior and adapts to user intent dynamically</p>
              <div className="solution-badge">Core System</div>
            </div>

            <div className="solution-card glass-card">
              <div className="solution-icon">
                <LineChart size={40} />
              </div>
              <h3>Application Visibility</h3>
              <p>Complete transparency with application tracking, status updates, and relationship insights</p>
              <div className="solution-badge">Core System</div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">Advanced Features</h2>
            <p className="section-subtitle">
              Powered by Groq AI & LLaMA 3.1 for intelligent matching
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card glass-card">
              <div className="feature-icon gradient-violet">
                <Sparkles size={32} />
              </div>
              <h3>Resume Intelligence</h3>
              <p>AI analyzes resumes, extracts skills, and generates compatibility scores with automatic matching to opportunities</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon gradient-cyan">
                <TrendingUp size={32} />
              </div>
              <h3>Candidate Ranking</h3>
              <p>Automatic ranking system scores candidates on experience, skills match, and resume quality for recruiters</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon gradient-green">
                <Zap size={32} />
              </div>
              <h3>AI Interview Simulator</h3>
              <p>Practice interviews with AI feedback, get personalized tips, and improve your performance before the real thing</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon gradient-orange">
                <Target size={32} />
              </div>
              <h3>Smart Job Matching</h3>
              <p>Graph-based matching considers not just skills but career trajectory, company culture fit, and growth potential</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">How The Ecosystem Works</h2>
          </div>

          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Join the Network</h3>
                <p>Create your node in the opportunity graph</p>
              </div>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Build Your Profile</h3>
                <p>AI extracts & structures your capabilities</p>
              </div>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Discover & Connect</h3>
                <p>Adaptive search finds optimal matches</p>
              </div>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Track & Succeed</h3>
                <p>Monitor relationships across the graph</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass-card">
            <Network size={64} className="cta-icon" />
            <h2>Ready to Join the Opportunity Graph?</h2>
            <p>Transform how you discover opportunities and talent</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">
                Get Started Free
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-info">
              <h4>JobGraph</h4>
              <p>The Intelligent Opportunity Network</p>
            </div>
            <div className="footer-tech">
              <span>Powered by Groq AI • LLaMA 3.1 • Graph Database</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
