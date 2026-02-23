const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    movies: [
      {
        movieId: Number,
        title: String,
        poster_path: String,
        rating: Number,
        releaseDate: Date,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#6366f1', // indigo
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique collection names per user
collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Collection', collectionSchema);
