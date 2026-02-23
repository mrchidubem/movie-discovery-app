const mongoose = require('mongoose');

const curatedCollectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    category: {
      type: String,
      enum: [
        'Best of 2024',
        'Hidden Gems',
        'Awards Season',
        'Trending Now',
        'Critically Acclaimed',
        'Underrated Gems',
        'Top Rated',
        'Staff Picks',
      ],
      required: true,
    },
    movies: [
      {
        movieId: String,
        title: String,
        poster: String,
        rating: Number,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      default: 'admin',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CuratedCollection', curatedCollectionSchema);
