const express = require('express');
const {
  addReview,
  getMovieReviews,
  getUserReviews,
  getReviewsByUserId,
  deleteReview,
} = require('../controllers/reviewController');
const auth = require('../middleware/auth');

const router = express.Router();

// Add a review - protected
router.post('/', auth, addReview);

// Get reviews for a specific movie - public
router.get('/:movieId', getMovieReviews);

// Get user's reviews - protected
router.get('/user/me', auth, getUserReviews);

// Get reviews by user id (public profile pages)
router.get('/user/:userId', getReviewsByUserId);

// Delete a review - protected
router.delete('/:id', auth, deleteReview);

module.exports = router; 