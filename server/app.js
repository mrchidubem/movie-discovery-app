const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import middleware
const { smartCache } = require('./middleware/cacheMiddleware');

// Import routes
const userRoutes = require('./routes/userRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const socialRoutes = require('./routes/socialRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const advancedSearchRoutes = require('./routes/advancedSearchRoutes');
const emailNotificationRoutes = require('./routes/emailNotificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const pushNotificationRoutes = require('./routes/pushNotificationRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for development
if (process.env.NODE_ENV === 'development') {
  app.use(cors());
  app.use(morgan('dev'));
}

// Apply intelligent caching middleware for GET requests
app.use('/api', smartCache);

// API routes
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search/advanced', advancedSearchRoutes);
app.use('/api/emails', emailNotificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/push', pushNotificationRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Any route that is not an API route will be redirected to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

module.exports = app; 