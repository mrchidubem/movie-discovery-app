import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaTrash, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getWatchlist, removeFromWatchlist } from '../services/watchlistService';
import Loader from '../components/Loader';
import { showToast } from '../components/ToastContainer';

const Watchlist = () => {
  const { isAuthenticated } = useAuth();

  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  
  // Additional filters
  const [minRating, setMinRating] = useState(0);
  const [minYear, setMinYear] = useState(1900);
  const [maxYear, setMaxYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/';
    }

    const fetchWatchlist = async () => {
      try {
        setLoading(true);
        const data = await getWatchlist();
        setWatchlist(data || []);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        showToast('error', 'Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [isAuthenticated]);

  const handleRemove = async (movieId) => {
    try {
      await removeFromWatchlist(movieId);
      setWatchlist(prev => prev.filter(item => item.movieId !== movieId));
      showToast('success', 'Removed from watchlist');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      showToast('error', 'Failed to remove from watchlist');
    }
  };

  const getSortedWatchlist = () => {
    let sorted = [...watchlist];
    
    // Apply filters
    sorted = sorted.filter(item => {
      const rating = item.rating || 0;
      const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 0;
      return rating >= minRating && year >= minYear && year <= maxYear;
    });
    
    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        sorted.reverse();
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'highest-rated':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'lowest-rated':
        sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'recent':
      default:
        // Already sorted by most recent
        break;
    }
    
    return sorted;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  const sortedWatchlist = getSortedWatchlist();

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h1 className="mb-2 text-3xl font-bold">My Watchlist</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {getSortedWatchlist().length} movie{getSortedWatchlist().length !== 1 ? 's' : ''} to watch
            </p>
          </div>
          {watchlist.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-white hover:bg-opacity-90"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
              <FaChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Advanced Filters Section */}
        {showFilters && watchlist.length > 0 && (
          <div className="mb-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Sort */}
              <div>
                <label className="mb-2 block text-sm font-medium">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="recent">Recently Added</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Alphabetical</option>
                  <option value="highest-rated">Highest Rated</option>
                  <option value="lowest-rated">Lowest Rated</option>
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="mb-2 block text-sm font-medium">Min Rating: {minRating.toFixed(1)}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Min Year */}
              <div>
                <label className="mb-2 block text-sm font-medium">From Year: {minYear}</label>
                <input
                  type="range"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={minYear}
                  onChange={(e) => setMinYear(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Max Year */}
              <div>
                <label className="mb-2 block text-sm font-medium">To Year: {maxYear}</label>
                <input
                  type="range"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={maxYear}
                  onChange={(e) => setMaxYear(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Reset button */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSortBy('recent');
                  setMinRating(0);
                  setMinYear(1900);
                  setMaxYear(new Date().getFullYear());
                }}
                className="rounded-md bg-gray-400 px-4 py-2 text-sm text-white hover:bg-gray-500"
              >
                Reset Filters
              </button>
              <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                Showing {getSortedWatchlist().length} of {watchlist.length} movies
              </span>
            </div>
          </div>
        )}

        {/* Sort Buttons (legacy - kept for quick access) */}
        {watchlist.length > 0 && !showFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'recent'
                  ? 'bg-secondary text-white'
                  : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Recently Added
            </button>
            <button
              onClick={() => setSortBy('oldest')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'oldest'
                  ? 'bg-secondary text-white'
                  : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Oldest First
            </button>
            <button
              onClick={() => setSortBy('title')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'title'
                  ? 'bg-secondary text-white'
                  : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Alphabetical
            </button>
          </div>
        )}

        {/* Watchlist Items */}
        {getSortedWatchlist().length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16 dark:bg-gray-800">
            <FaClock className="mb-4 text-5xl text-gray-400" />
            <p className="mb-6 text-xl text-gray-600 dark:text-gray-400">
              {watchlist.length === 0 ? 'Your watchlist is empty' : 'No movies match your filters'}
            </p>
            <Link
              to="/search"
              className="rounded-lg bg-secondary px-6 py-3 font-medium text-white hover:bg-secondary/90 inline-block"
            >
              Find Movies to Watch
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {getSortedWatchlist().map(item => (
              <div
                key={item._id}
                className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-4 flex-1">
                  {item.poster && (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${item.poster}`}
                      alt={item.title}
                      className="h-24 w-16 rounded-md object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.releaseDate && new Date(item.releaseDate).getFullYear()}
                    </p>
                    {item.rating && (
                      <p className="text-sm text-yellow-500 font-medium">
                        ⭐ {item.rating.toFixed(1)}/10
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/movie/${item.movieId}#watch`}
                    className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90 text-center sm:flex-none"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleRemove(item.movieId)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
                    title="Remove from watchlist"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
