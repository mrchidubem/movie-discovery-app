const mongoose = require('mongoose');

const socialProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    recentActivity: [
      {
        type: {
          type: String,
          enum: ['RATED', 'FAVORITED', 'WATCHLISTED'],
        },
        movieId: String,
        movieTitle: String,
        timestamp: Date,
      },
    ],
    bio: String,
    avatar: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocialProfile', socialProfileSchema);
