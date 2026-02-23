const mongoose = require('mongoose');

const movieCacheSchema = new mongoose.Schema(
  {
    movieId: {
      type: String,
      unique: true,
      required: true,
    },
    title: String,
    imdbScore: Number,
    rottenTomatoesScore: Number,
    contentWarnings: {
      violence: String,
      language: String,
      themes: String,
    },
    parentalGuideSummary: String,
    awards: [
      {
        name: String,
        won: Boolean,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('MovieCache', movieCacheSchema);
