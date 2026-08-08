import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import JobDetails from './pages/JobDetails';
import Profile from './pages/Profile';
import Applications from './pages/Applications';
import Interview from './pages/Interview';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'candidate' ? '/candidate' : '/recruiter'} replace />;
  }

  return children;
}

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Hide navbar on recruiter dashboard (has its own sidebar)
  const hideNavbar = location.pathname === '/recruiter' && user?.role === 'recruiter';

  return (
    <div className="app">
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to={user?.role === 'recruiter' ? '/recruiter' : '/candidate'} replace /> : <Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'recruiter' ? '/recruiter' : '/candidate'} replace /> : <Login />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to={user?.role === 'recruiter' ? '/recruiter' : '/candidate'} replace /> : <Signup />} />

        <Route path="/candidate" element={
          <ProtectedRoute requiredRole="candidate">
            <CandidateDashboard />
          </ProtectedRoute>
        } />

        <Route path="/recruiter" element={
          <ProtectedRoute requiredRole="recruiter">
            <RecruiterDashboard />
          </ProtectedRoute>
        } />

        <Route path="/job/:id" element={
          <ProtectedRoute>
            <JobDetails />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute requiredRole="candidate">
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/applications" element={
          <ProtectedRoute requiredRole="candidate">
            <Applications />
          </ProtectedRoute>
        } />

        <Route path="/interview" element={
          <ProtectedRoute requiredRole="candidate">
            <Interview />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
