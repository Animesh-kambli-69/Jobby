import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, User, Home, Sparkles, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Sparkles className="logo-icon" />
          <span className="logo-text">JobGraph</span>
          <span className="logo-badge">AI</span>
        </Link>

        <div className="navbar-links">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
                <LogIn size={18} />
                <span>Login</span>
              </Link>
              <Link to="/signup" className={`nav-link nav-link-primary ${isActive('/signup') ? 'active' : ''}`}>
                <UserPlus size={18} />
                <span>Sign Up</span>
              </Link>
            </>
          ) : (
            <>
              {user?.role === 'candidate' && (
                <>
                  <Link
                    to="/candidate"
                    className={`nav-link ${isActive('/candidate') ? 'active' : ''}`}
                  >
                    <Home size={18} />
                    <span>Find Jobs</span>
                  </Link>
                  <Link
                    to="/profile"
                    className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </Link>
                </>
              )}

              {user?.role === 'recruiter' && (
                <>
                  <Link
                    to="/recruiter"
                    className={`nav-link ${isActive('/recruiter') ? 'active' : ''}`}
                  >
                    <Briefcase size={18} />
                    <span>Dashboard</span>
                  </Link>
                </>
              )}

              <div className="nav-user-info">
                <User size={16} />
                <span>{user?.name}</span>
                {user?.resumeScore > 0 && (
                  <span className="nav-score">{user.resumeScore}</span>
                )}
              </div>

              <button onClick={handleLogout} className="nav-link nav-link-logout">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
