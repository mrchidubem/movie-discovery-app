import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { showToast } from '../components/ToastContainer';
import api from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && storedUser !== 'undefined' && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    try {
      setLoading(true);
      const { data } = await api.post('/api/users/login', { email, password });

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      showToast('Logged in successfully!', 'success');
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Login failed';
      showToast(message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    try {
      setLoading(true);
      const { data } = await api.post('/api/users/register', { name, email, password });

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      showToast('Account created successfully!', 'success');
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Registration failed';
      showToast(message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    showToast('Logged out', 'info');
  }, []);

  // Update user data (for profile updates, etc.)
  const updateUser = useCallback((updatedUserData) => {
    setUser(prevUser => {
      const newUser = { ...prevUser, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;