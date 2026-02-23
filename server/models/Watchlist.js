const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movieId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  poster: String,
  overview: String,
  rating: Number,
  releaseDate: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate entries
watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;
