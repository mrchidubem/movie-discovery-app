import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Recommended for React Router + deployment
  base: '/',

  // Development-only proxy (ignored in production)
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // your local backend
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Optional: if you want to override proxy in production (rarely needed)
  // You will set the real API URL via environment variables instead
});