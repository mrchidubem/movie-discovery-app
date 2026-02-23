import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaTimes, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setFormErrors({});
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    const { name, email, password, confirmPassword } = formData;

    if (mode === 'signup' && !name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email format';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (mode === 'signup' && password !== confirmPassword)
      errors.confirmPassword = 'Passwords do not match';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  let success = false;

  if (mode === 'login') {
    success = await login({ email: formData.email, password: formData.password });
  } else {
    success = await register({ name: formData.name, email: formData.email, password: formData.password });
  }

  if (success) {
    onClose();  // close modal after successful login/signup
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl z-10 overflow-hidden">
        <div className="relative px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </h2>
          <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={onClose} aria-label="Close modal">
            <FaTimes size={20} />
          </button>
        </div>

        <form className="px-6 py-6" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
              <div className="relative">
                <FaUser className="absolute inset-y-0 left-0 pl-3 text-gray-500 pointer-events-none" />
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Your name" className="w-full py-3 pl-10 pr-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-secondary bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-secondary/50" />
              </div>
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute inset-y-0 left-0 pl-3 text-gray-500 pointer-events-none" />
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="your.email@example.com" className="w-full py-3 pl-10 pr-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-secondary bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-secondary/50" />
            </div>
            {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <FaLock className="absolute inset-y-0 left-0 pl-3 text-gray-500 pointer-events-none" />
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••" className="w-full py-3 pl-10 pr-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-secondary bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-secondary/50" />
            </div>
            {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
          </div>

          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Confirm Password</label>
              <div className="relative">
                <FaLock className="absolute inset-y-0 left-0 pl-3 text-gray-500 pointer-events-none" />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  placeholder="••••••••" className="w-full py-3 pl-10 pr-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-secondary bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-secondary/50" />
              </div>
              {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-secondary text-white rounded-lg flex items-center justify-center font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:bg-secondary/90 transition-colors">
            {loading ? <Loader size="small" /> : mode === 'login' ? <><FaSignInAlt className="mr-2"/>Login</> : <><FaUserPlus className="mr-2"/>Sign Up</>}
          </button>
        </form>

        <div className="px-6 py-4 text-center text-sm border-t dark:border-gray-700">
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-secondary font-semibold hover:underline">
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;