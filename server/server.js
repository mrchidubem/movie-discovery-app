const mongoose = require('mongoose');
const path = require('path');
const app = require('./app');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 5000;

// Start server even if DB is temporarily unavailable (dev-friendly).
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Connect to MongoDB (recommended, but don't hard-exit in development)
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.warn('MONGODB_URI not set. Starting without database connection.');
} else {
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
}); 