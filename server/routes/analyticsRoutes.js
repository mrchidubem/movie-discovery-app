const express = require('express');
const auth = require('../middleware/auth');
const Rating = require('../models/Rating');
const WatchingHistory = require('../models/WatchingHistory');
const UserAnalytics = require('../models/UserAnalytics');

const router = express.Router();

// Get user's analytics dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let analytics = await UserAnalytics.findOne({ userId });
    
    if (!analytics) {
      analytics = await UserAnalytics.create({ userId });
    }

    const ratings = await Rating.find({ userId }).sort({ createdAt: -1 });
    const topRated = ratings
      .filter(r => r.rating >= 4)
      .slice(0, 5)
      .map(r => ({ movieId: r.movieId, title: r.title, rating: r.rating }));

    res.json({
      moviesWatched: analytics.moviesWatched || ratings.length,
      totalHoursWatched: analytics.totalHoursWatched || 0,
      averageRating: ratings.length > 0 
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : 0,
      topRatedMovies: topRated,
      recentRatings: ratings.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get year-in-review stats
router.get('/year-review/:year', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.params.year);
    
    const ratings = await Rating.find({ userId });
    const yearRatings = ratings.filter(r => {
      const ratingYear = new Date(r.createdAt).getFullYear();
      return ratingYear === year;
    });

    const topGenres = {};
    const topMovies = yearRatings.sort((a, b) => b.rating - a.rating).slice(0, 5);

    res.json({
      year,
      moviesWatchedInYear: yearRatings.length,
      averageRating: yearRatings.length > 0
        ? (yearRatings.reduce((sum, r) => sum + r.rating, 0) / yearRatings.length).toFixed(1)
        : 0,
      topMovies,
      mostWatchedGenres: topGenres,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update analytics
router.post('/update', auth, async (req, res) => {
  try {
    const { movieId, title, genres, runtime } = req.body;
    let analytics = await UserAnalytics.findOne({ userId: req.user.id });
    
    if (!analytics) {
      analytics = new UserAnalytics({ userId: req.user.id });
    }

    analytics.moviesWatched += 1;
    if (runtime) analytics.totalHoursWatched += runtime / 60;

    await analytics.save();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
