const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    badgeType: {
      type: String,
      enum: [
        'film_critic',      // 5+ reviews
        'movie_enthusiast', // 10+ favorites
        'collector',        // 20+ favorites
        'watchlist_master', // 15+ movies in watchlist
        'rating_expert',    // 10+ movies with ratings
        'social_butterfly', // 5+ followers
      ],
      required: true,
    },
    title: String,
    description: String,
    icon: String, // emoji or icon name
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one badge per user per type
badgeSchema.index({ userId: 1, badgeType: 1 }, { unique: true });

module.exports = mongoose.model('Badge', badgeSchema);
