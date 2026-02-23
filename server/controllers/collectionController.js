const Collection = require('../models/Collection');

// Get all collections for a user
const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

// Get a specific collection
const getCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check if user has access (collection is theirs or it's public)
    if (collection.userId.toString() !== req.user.id && !collection.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
};

// Create a new collection
const createCollection = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    // Check if collection with same name already exists for this user
    const existing = await Collection.findOne({
      userId: req.user.id,
      name: name.trim(),
    });

    if (existing) {
      return res.status(400).json({
        error: 'A collection with this name already exists',
      });
    }

    const collection = new Collection({
      userId: req.user.id,
      name: name.trim(),
      description: description || '',
      color: color || '#6366f1',
      movies: [],
    });

    await collection.save();
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
};

// Update a collection
const updateCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { name, description, color, isPublic } = req.body;

    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (name && name.trim().length > 0) {
      // Check if new name conflicts with another collection
      if (name.trim() !== collection.name) {
        const existing = await Collection.findOne({
          userId: req.user.id,
          name: name.trim(),
        });

        if (existing) {
          return res.status(400).json({
            error: 'A collection with this name already exists',
          });
        }
      }

      collection.name = name.trim();
    }

    if (description !== undefined) {
      collection.description = description;
    }

    if (color !== undefined) {
      collection.color = color;
    }

    if (isPublic !== undefined) {
      collection.isPublic = isPublic;
    }

    await collection.save();
    res.json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
};

// Delete a collection
const deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Collection.findByIdAndDelete(collectionId);
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
};

// Add movie to collection
const addMovieToCollection = async (req, res) => {
  try {
    const { collectionId, movieId, title, poster_path, rating, releaseDate } = req.body;

    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if movie already exists in collection
    const movieExists = collection.movies.some(m => m.movieId === movieId);

    if (movieExists) {
      return res.status(400).json({ error: 'Movie already in collection' });
    }

    collection.movies.push({
      movieId,
      title,
      poster_path,
      rating,
      releaseDate,
      addedAt: new Date(),
    });

    await collection.save();
    res.json(collection);
  } catch (error) {
    console.error('Error adding movie to collection:', error);
    res.status(500).json({ error: 'Failed to add movie to collection' });
  }
};

// Remove movie from collection
const removeMovieFromCollection = async (req, res) => {
  try {
    const { collectionId, movieId } = req.params;

    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    collection.movies = collection.movies.filter(m => m.movieId !== parseInt(movieId));
    await collection.save();

    res.json(collection);
  } catch (error) {
    console.error('Error removing movie from collection:', error);
    res.status(500).json({ error: 'Failed to remove movie from collection' });
  }
};

module.exports = {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addMovieToCollection,
  removeMovieFromCollection,
};
