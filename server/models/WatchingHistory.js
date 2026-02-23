const mongoose = require('mongoose');

const watchingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: {
      type: String,
      required: true,
    },
    title: String,
    poster: String,
    genres: [String],
    viewedAt: {
      type: Date,
      default: Date.now,
    },
    watchDuration: Number, // in minutes watched
    completed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate history entries (same movie by same user in same day)
watchingHistorySchema.index({ userId: 1, movieId: 1 });

module.exports = mongoose.model('WatchingHistory', watchingHistorySchema);
