const Watchlist = require('../models/Watchlist');

// Get all watchlist items for a user
const getWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ userId: req.user._id })
      .sort({ addedAt: -1 });
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add movie to watchlist
const addToWatchlist = async (req, res) => {
  try {
    const { movieId, title, poster, overview, rating, releaseDate } = req.body;
    
    const watchlistItem = new Watchlist({
      userId: req.user._id,
      movieId,
      title,
      poster,
      overview,
      rating,
      releaseDate
    });
    
    await watchlistItem.save();
    res.status(201).json(watchlistItem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Movie already in watchlist' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Remove movie from watchlist
const removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    await Watchlist.deleteOne({ userId: req.user._id, movieId });
    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
};
