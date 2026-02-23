const express = require('express');
const {
  getMovieRatings,
  getUserMovieRating,
  getUserRatings,
  createOrUpdateRating,
  deleteRating,
  getMovieAverageRating,
  getUserTopRatedMovies,
} = require('../controllers/ratingController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/movie/:movieId', getMovieRatings);
router.get('/movie/:movieId/average', getMovieAverageRating);

// Protected routes
router.get('/user/:movieId', auth, getUserMovieRating);
router.get('/user/ratings/all', auth, getUserRatings);
router.get('/user/top-rated', auth, getUserTopRatedMovies);
router.get('/:movieId', auth, getUserMovieRating);
router.post('/', auth, createOrUpdateRating);
router.delete('/:movieId', auth, deleteRating);

module.exports = router;
