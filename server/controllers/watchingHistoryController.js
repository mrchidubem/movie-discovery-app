const WatchingHistory = require('../models/WatchingHistory');

// Add movie to watching history
const addToWatchingHistory = async (req, res) => {
  try {
    const { movieId, title, poster, genres } = req.body;
    const userId = req.user._id;

    const history = new WatchingHistory({
      userId,
      movieId,
      title,
      poster,
      genres: genres || [],
      viewedAt: new Date(),
    });

    await history.save();
    res.status(201).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add to watching history', error });
  }
};

// Get user's watching history
const getWatchingHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = req.query.limit || 20;
    const history = await WatchingHistory.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(parseInt(limit, 10));
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch watching history', error });
  }
};

// Get user's favorite genres from history
const getUserGenreStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await WatchingHistory.aggregate([
      { $match: { userId } },
      { $unwind: '$genres' },
      {
        $group: {
          _id: '$genres',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch genre stats', error });
  }
};

// Get year in review stats
const getYearInReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const year = req.query.year || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const stats = await WatchingHistory.aggregate([
      {
        $match: {
          userId,
          viewedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalMovies: { $sum: 1 },
          topGenres: { $push: '$genres' },
        },
      },
    ]);

    const topMovies = await WatchingHistory.find({
      userId,
      viewedAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ viewedAt: -1 })
      .limit(10);

    res.json({
      year,
      stats: stats[0] || { totalMovies: 0 },
      topMovies,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch year in review', error });
  }
};

// Clear watching history
const clearWatchingHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    await WatchingHistory.deleteMany({ userId });
    res.json({ message: 'Watching history cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear history', error });
  }
};

module.exports = {
  addToWatchingHistory,
  getWatchingHistory,
  getUserGenreStats,
  getYearInReview,
  clearWatchingHistory,
};
