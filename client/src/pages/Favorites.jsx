import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaTrash, FaImage, FaChevronDown } from 'react-icons/fa';
import { getFavorites, removeFromFavorites } from '../services/favoriteService';
import { getImageUrl, getMovieDetails } from '../services/tmdbApi';
import Loader from '../components/Loader';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [sortBy, setSortBy] = useState('recent');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [minYear, setMinYear] = useState(1900);
  const [maxYear, setMaxYear] = useState(new Date().getFullYear());

  // All available genres
  const allGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
  ];

  // Use a fallback for missing images
  const renderPoster = (favorite) => {
    if (favorite.poster) {
      return (
        <img
          src={getImageUrl(favorite.poster)}
          alt={`${favorite.title} poster`}
          className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.parentNode.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200');
            const fallback = document.createElement('div');
            fallback.innerHTML = `<div class="flex flex-col items-center justify-center">
              <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" clipRule="evenodd" />
              </svg>
              <p class="mt-2 text-sm text-gray-500">No image available</p>
            </div>`;
            e.target.parentNode.appendChild(fallback.firstChild);
          }}
        />
      );
    } else {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-200">
          <FaImage className="h-16 w-16 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No image available</p>
        </div>
      );
    }
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const data = await getFavorites();
        setFavorites(data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setError('Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  // Apply filters and sorting whenever filter states change
  useEffect(() => {
    let result = [...favorites];

    // Filter by rating
    result = result.filter(fav => {
      const rating = fav.rating || 0;
      return rating >= minRating;
    });

    // Filter by year
    result = result.filter(fav => {
      const year = fav.releaseDate ? new Date(fav.releaseDate).getFullYear() : 0;
      return year >= minYear && year <= maxYear;
    });

    // Filter by genres (if genres are available)
    if (selectedGenres.length > 0 && result.some(fav => fav.genres)) {
      result = result.filter(fav => {
        if (!fav.genres) return true;
        const movieGenres = Array.isArray(fav.genres) ? fav.genres : [];
        return selectedGenres.some(genre => 
          movieGenres.some(mg => 
            mg.toLowerCase() === genre.toLowerCase()
          )
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0));
        break;
      case 'highest-rated':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'lowest-rated':
        result.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'a-z':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'z-a':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    setFilteredFavorites(result);
  }, [favorites, sortBy, selectedGenres, minRating, minYear, maxYear]);

  const handleRemoveFavorite = async (movieId) => {
    try {
      await removeFromFavorites(movieId);
      setFavorites(favorites.filter(fav => fav.movieId !== movieId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (loading) {
    return <Loader size="large" />;
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <FaHeart className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold">No favorites yet</h2>
        <p className="mb-6 mt-2 text-gray-600 dark:text-gray-400">
          Start exploring and add some movies to your favorites
        </p>
        <Link
          to="/"
          className="inline-flex items-center rounded-md bg-secondary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Explore Movies
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <h1 className="text-3xl font-bold">My Favorites</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-white hover:bg-opacity-90"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
          <FaChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters section */}
      {showFilters && (
        <div className="mb-8 rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Sort */}
            <div>
              <label className="mb-2 block text-sm font-medium">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="highest-rated">Highest Rated</option>
                <option value="lowest-rated">Lowest Rated</option>
                <option value="a-z">A to Z</option>
                <option value="z-a">Z to A</option>
              </select>
            </div>

            {/* Rating filter */}
            <div>
              <label className="mb-2 block text-sm font-medium">Minimum Rating: {minRating.toFixed(1)}</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">0 - 10</div>
            </div>

            {/* Year from filter */}
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

            {/* Year to filter */}
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

          {/* Genres filter */}
          <div className="mt-6">
            <label className="mb-3 block text-sm font-medium">Filter by Genre</label>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {allGenres.map(genre => (
                <label key={genre} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGenres([...selectedGenres, genre]);
                      } else {
                        setSelectedGenres(selectedGenres.filter(g => g !== genre));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{genre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reset filters button */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => {
                setSortBy('recent');
                setSelectedGenres([]);
                setMinRating(0);
                setMinYear(1900);
                setMaxYear(new Date().getFullYear());
              }}
              className="rounded-md bg-gray-400 px-4 py-2 text-sm text-white hover:bg-gray-500"
            >
              Reset Filters
            </button>
            <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredFavorites.length} of {favorites.length} movies
            </span>
          </div>
        </div>
      )}

      {filteredFavorites.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-600 dark:text-gray-400">No movies match your filters</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFavorites.map((favorite) => (
            <div key={favorite._id} className="card group relative">
              {/* Remove button */}
              <button
                onClick={() => handleRemoveFavorite(favorite.movieId)}
                className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                aria-label="Remove from favorites"
              >
                <FaTrash className="text-red-500" />
              </button>

              {/* Movie link */}
              <Link to={`/movie/${favorite.movieId}#watch`}>
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-200">
                  {renderPoster(favorite)}
                </div>

                {/* Movie info */}
                <div className="p-4">
                  <h3 className="mb-1 text-lg font-medium line-clamp-1">{favorite.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {favorite.releaseDate
                        ? new Date(favorite.releaseDate).getFullYear()
                        : 'N/A'}
                    </span>
                    {favorite.rating && (
                      <div className="flex items-center">
                        <FaHeart className="mr-1 text-red-500" />
                        <span>{favorite.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
                    {favorite.overview}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;