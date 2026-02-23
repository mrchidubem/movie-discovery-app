import axios from 'axios';

// Create an Axios instance for our backend API
const api = axios.create({
  // Prefer explicit API URL (useful when frontend/backed are on different origins),
  // otherwise fall back to relative URLs (works with Vite proxy and same-origin deploys).
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api; 