const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    review: String,
    watched: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate ratings for same movie by user
ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
