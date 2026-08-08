import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const storedUser = (() => {
        try {
          const value = localStorage.getItem('user');
          return value ? JSON.parse(value) : null;
        } catch (error) {
          return null;
        }
      })();

      const currentRole = user?.role || storedUser?.role;
      const meEndpoint = currentRole === 'recruiter' ? '/recruiter-auth/me' : '/auth/me';

      const response = await axios.get(`${API_URL}${meEndpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Fetch user error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role, company) => {
    try {
      const isRecruiter = role === 'recruiter';
      const endpoint = isRecruiter ? `${API_URL}/recruiter-auth/register` : `${API_URL}/auth/register`;

      const payload = isRecruiter
        ? { name, email, password, company }
        : { name, email, password, role, company };

      const response = await axios.post(endpoint, payload);

      const { token: newToken, user: newUser } = response.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      return newUser;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const login = async (email, password, role = 'candidate') => {
    try {
      const endpoint = role === 'recruiter' ? `${API_URL}/recruiter-auth/login` : `${API_URL}/auth/login`;

      const response = await axios.post(endpoint, {
        email,
        password
      });

      const { token: newToken, user: newUser } = response.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      return newUser;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('candidateProfile');
  };

  const updateUserProfile = async (formData) => {
    try {
      const response = await axios.put(`${API_URL}/auth/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return response.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateUserProfile,
    isAuthenticated: !!user,
    isCandidate: user?.role === 'candidate',
    isRecruiter: user?.role === 'recruiter'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
