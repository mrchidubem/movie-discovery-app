import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaTrash, FaEdit, FaLock, FaUnlock, FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addMovieToCollection,
  removeMovieFromCollection,
} from '../services/collectionService';
import { showToast } from '../components/ToastContainer';
import Loader from '../components/Loader';

const Collections = () => {
  const { isAuthenticated } = useAuth();

  const [collections, setCollections] = useState([]);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('#6366f1');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCollections = async () => {
      try {
        setLoading(true);
        const data = await getCollections();
        setCollections(data || []);
      } catch (error) {
        console.error('Error fetching collections:', error);
        showToast('error', 'Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [isAuthenticated]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();

    if (!newCollectionName.trim()) {
      showToast('error', 'Collection name is required');
      return;
    }

    try {
      const newCollection = await createCollection({
        name: newCollectionName,
        description: newCollectionDescription,
        color: newCollectionColor,
      });

      setCollections([newCollection, ...collections]);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setNewCollectionColor('#6366f1');
      setShowCreateModal(false);
      showToast('success', 'Collection created successfully');
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to create collection');
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      try {
        await deleteCollection(collectionId);
        setCollections(collections.filter(c => c._id !== collectionId));
        setCurrentCollection(null);
        showToast('success', 'Collection deleted successfully');
      } catch (error) {
        showToast('error', 'Failed to delete collection');
      }
    }
  };

  const handleRemoveMovie = async (collectionId, movieId) => {
    try {
      await removeMovieFromCollection(collectionId, movieId);

      if (currentCollection?._id === collectionId) {
        const updated = await getCollection(collectionId);
        setCurrentCollection(updated);
      }

      const updated = collections.map(c =>
        c._id === collectionId
          ? { ...c, movies: c.movies.filter(m => m.movieId !== movieId) }
          : c
      );
      setCollections(updated);
      showToast('success', 'Movie removed from collection');
    } catch (error) {
      showToast('error', 'Failed to remove movie');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  if (currentCollection) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl px-4">
          <button
            onClick={() => setCurrentCollection(null)}
            className="mb-6 flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
          >
            <FaArrowLeft /> Back to Collections
          </button>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
                {currentCollection.name}
              </h1>
              {currentCollection.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {currentCollection.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteCollection(currentCollection._id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                <FaTrash className="mr-2 inline-block" />
                Delete Collection
              </button>
            </div>
          </div>

          {currentCollection.movies.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-400">No movies in this collection yet</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentCollection.movies.map(movie => (
                <div key={movie.movieId} className="relative">
                  <Link to={`/movie/${movie.movieId}#watch`}>
                    <div className="aspect-[2/3] rounded-lg bg-gray-200 overflow-hidden">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                          alt={movie.title}
                          className="h-full w-full object-cover hover:opacity-75 transition-opacity"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-300 dark:bg-gray-700">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={() => handleRemoveMovie(currentCollection._id, movie.movieId)}
                    className="absolute right-2 top-2 rounded-full bg-red-600/80 p-2 text-white hover:bg-red-700"
                    title="Remove from collection"
                  >
                    <FaTimes />
                  </button>

                  <div className="mt-3">
                    <h3 className="font-semibold line-clamp-2 text-gray-900 dark:text-white">
                      {movie.title}
                    </h3>
                    {movie.rating && (
                      <p className="text-sm text-yellow-500">⭐ {movie.rating.toFixed(1)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">My Collections</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 text-white hover:bg-secondary/90"
          >
            <FaPlus /> New Collection
          </button>
        </div>

        {/* Create Collection Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="w-full max-w-md rounded-lg bg-white p-8 dark:bg-gray-800">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create Collection</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g., Sci-Fi Classics"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (optional)
                  </label>
                  <textarea
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows="3"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newCollectionColor}
                    onChange={(e) => setNewCollectionColor(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-secondary px-4 py-2 text-white hover:bg-secondary/90"
                  >
                    Create Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {collections.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-800">
            <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
              You haven't created any collections yet
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-secondary px-6 py-2 text-white hover:bg-secondary/90"
            >
              Create Your First Collection
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collections.map(collection => (
              <div
                key={collection._id}
                onClick={() => setCurrentCollection(collection)}
                className="group cursor-pointer rounded-lg overflow-hidden bg-white shadow-md transition-transform hover:scale-105 dark:bg-gray-800"
              >
                <div
                  className="h-32 flex items-center justify-center text-white text-4xl"
                  style={{ backgroundColor: collection.color }}
                >
                  🎬
                </div>
                <div className="p-4">
                  <h3 className="mb-2 font-bold text-gray-900 line-clamp-2 dark:text-white">
                    {collection.name}
                  </h3>
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {collection.description || 'No description'}
                  </p>
                  <p className="text-sm font-medium text-Gray-700 dark:text-gray-300">
                    {collection.movies.length} movie{collection.movies.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collections;
