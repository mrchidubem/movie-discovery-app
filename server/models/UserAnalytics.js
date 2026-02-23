const mongoose = require('mongoose');

const userAnalyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    moviesWatched: {
      type: Number,
      default: 0,
    },
    totalHoursWatched: {
      type: Number,
      default: 0,
    },
    favoriteGenres: [String],
    topRatedMovies: [
      {
        movieId: String,
        rating: Number,
      },
    ],
    watchedByYear: {
      type: Map,
      of: Number,
    },
    watchedByGenre: {
      type: Map,
      of: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserAnalytics', userAnalyticsSchema);
