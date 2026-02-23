const express = require('express');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all watchlist items
router.get('/', auth, getWatchlist);

// Add to watchlist
router.post('/', auth, addToWatchlist);

// Remove from watchlist
router.delete('/:movieId', auth, removeFromWatchlist);

module.exports = router;
