import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMovies, getMoviesByGenre } from '../services/tmdbApi';
import { getFavorites } from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';
import MovieGrid from '../components/MovieGrid';
import Loader from '../components/Loader';
import { FaSearch } from 'react-icons/fa';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';

  const { isAuthenticated } = useAuth();

  const [searchInput, setSearchInput] = useState(query);
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch movies whenever query, genre, or page changes
  useEffect(() => {
    const fetchMovies = async () => {
      if (!query.trim() && !genre.trim()) {
        setMovies([]);
        setTotalPages(0);
        return;
      }

      try {
        setLoading(true);
        let data;

        if (genre) {
          // Fetch by genre from footer category links
          data = await getMoviesByGenre(genre, currentPage, true); // cache-bust for fresh results
        } else {
          // Text search
          data = await searchMovies(query, currentPage);
        }

        setMovies(data.results || []);
        setTotalPages(data.total_pages > 500 ? 500 : data.total_pages);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to fetch movies');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [query, genre, currentPage]);

  // Fetch user favorites
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchFavorites = async () => {
      try {
        const data = await getFavorites();
        setFavorites(data);
      } catch (err) {
        console.error('Favorites fetch error:', err);
      }
    };

    fetchFavorites();
  }, [isAuthenticated]);

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
      setCurrentPage(1);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle favorites
  const handleFavoriteToggle = (movieId) => {
    setFavorites((prev) => {
      const exists = prev.some(fav => fav.movieId === movieId.toString());
      if (exists) return prev.filter(fav => fav.movieId !== movieId.toString());
      return prev; // or optionally push new favorite if integrated with API
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Form */}
      <form onSubmit={handleSearchSubmit} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search movies..."
              className="w-full rounded-lg border border-gray-300 py-3 pl-4 pr-10 shadow-sm focus:border-secondary focus:ring-1 focus:ring-secondary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              autoFocus
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-secondary dark:text-gray-400">
              <FaSearch />
            </button>
          </div>
          <button
            type="submit"
            className="bg-secondary px-4 py-3 sm:px-6 rounded-lg text-white font-medium hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Search Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size="large" />
        </div>
      ) : error ? (
        <div className="flex justify-center py-12 text-red-500 text-lg">{error}</div>
      ) : !query.trim() && !genre.trim() ? (
        <div className="flex justify-center py-12 text-gray-500 text-lg">
          Enter a search term or select a category to find movies
        </div>
      ) : movies.length === 0 ? (
        <div className="flex justify-center py-12 text-gray-500 text-lg">
          {genre
            ? `No movies found in "${genre}" category`
            : `No results found for "${query}"`}
        </div>
      ) : (
        <MovieGrid
          movies={movies}
          title={genre ? `${genre.charAt(0).toUpperCase() + genre.slice(1)} Movies` : `Search Results for "${query}"`}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          favorites={favorites}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}
    </div>
  );
};

export default SearchPage;