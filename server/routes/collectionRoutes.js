const express = require('express');
const {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addMovieToCollection,
  removeMovieFromCollection,
} = require('../controllers/collectionController');
const auth = require('../middleware/auth');

const router = express.Router();

// All collection routes require authentication
router.use(auth);

// Get all collections for current user
router.get('/', getCollections);

// Get a specific collection
router.get('/:collectionId', getCollection);

// Create a new collection
router.post('/', createCollection);

// Update a collection
router.put('/:collectionId', updateCollection);

// Delete a collection
router.delete('/:collectionId', deleteCollection);

// Add movie to collection
router.post('/:collectionId/movies', addMovieToCollection);

// Remove movie from collection
router.delete('/:collectionId/movies/:movieId', removeMovieFromCollection);

module.exports = router;
