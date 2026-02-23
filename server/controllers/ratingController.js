const Rating = require('../models/Rating');

// Get all ratings for a movie
const getMovieRatings = async (req, res) => {
  try {
    const { movieId } = req.params;
    const ratings = await Rating.find({ movieId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    const count = ratings.length;
    const avgRating = count
      ? Number((ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1))
      : 0;

    res.json({ ratings, avgRating, count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ratings', error });
  }
};

// Get user's rating for a movie
const getUserMovieRating = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;
    const rating = await Rating.findOne({ userId, movieId });
    res.json(rating || null);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rating', error });
  }
};

// Get all user ratings
const getUserRatings = async (req, res) => {
  try {
    const userId = req.user._id;
    const ratings = await Rating.find({ userId }).sort({ createdAt: -1 });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user ratings', error });
  }
};

// Create or update a rating
const createOrUpdateRating = async (req, res) => {
  try {
    const { movieId, rating, review, title, poster } = req.body;
    const userId = req.user._id;

    const numericRating = Number(rating);
    if (!movieId || !numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Invalid rating data' });
    }

    let userRating = await Rating.findOne({ userId, movieId });

    if (userRating) {
      userRating.rating = numericRating;
      if (review) userRating.review = review;
      await userRating.save();
    } else {
      userRating = new Rating({
        userId,
        movieId,
        rating: numericRating,
        review,
        title,
        poster,
        watched: true,
      });
      await userRating.save();
    }

    res.status(201).json(userRating);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save rating', error });
  }
};

// Delete a rating
const deleteRating = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    const result = await Rating.findOneAndDelete({ userId, movieId });
    if (!result) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete rating', error });
  }
};

// Get average rating for a movie
const getMovieAverageRating = async (req, res) => {
  try {
    const { movieId } = req.params;
    const result = await Rating.aggregate([
      { $match: { movieId } },
      {
        $group: {
          _id: '$movieId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json({ averageRating: 0, totalRatings: 0 });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch average rating', error });
  }
};

// Get user's top rated movies
const getUserTopRatedMovies = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = req.query.limit || 10;
    const topRated = await Rating.find({ userId })
      .sort({ rating: -1 })
      .limit(parseInt(limit, 10));
    res.json(topRated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch top rated movies', error });
  }
};

module.exports = {
  getMovieRatings,
  getUserMovieRating,
  getUserRatings,
  createOrUpdateRating,
  deleteRating,
  getMovieAverageRating,
  getUserTopRatedMovies,
};
