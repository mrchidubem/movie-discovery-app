import { useState, useEffect } from 'react';
import { getTrending, getNowPlaying, getUpcoming, searchMovies } from '../services/tmdbApi';
import { getFavorites } from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';
import TrendingSlider from '../components/TrendingSlider';
import MovieGrid from '../components/MovieGrid';
import Loader from '../components/Loader';

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [suggestedMovies, setSuggestedMovies] = useState([]);
  const [suggestionSeedTitle, setSuggestionSeedTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Fetch trending, new releases, and upcoming movies
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const [trendingData, nowPlayingData, upcomingData] = await Promise.all([
          getTrending(currentPage),
          getNowPlaying(1, true), // cache-bust for fresh data
          getUpcoming(1, true),   // cache-bust for fresh data
        ]);
        setTrendingMovies(trendingData.results);
        setNewReleases(nowPlayingData.results || []);
        setUpcomingMovies(upcomingData.results || []);
        setTotalPages(trendingData.total_pages > 500 ? 500 : trendingData.total_pages);
      } catch (error) {
        console.error('Error fetching movies:', error);
        setError('Failed to load movies');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [currentPage]);

  // Fetch favorites if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchFavorites = async () => {
        try {
          const data = await getFavorites();
          setFavorites(data);
        } catch (error) {
          console.error('Error fetching favorites:', error);
        }
      };

      fetchFavorites();
    }
  }, [isAuthenticated]);

  // Personalized, real-time suggestions based on a random favorite title
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!favorites || favorites.length === 0) {
        setSuggestedMovies([]);
        setSuggestionSeedTitle('');
        return;
      }

      try {
        // pick a random favorite as the "seed"
        const seed = favorites[Math.floor(Math.random() * favorites.length)];
        const seedTitle = seed.title || '';
        if (!seedTitle) return;

        const data = await searchMovies(seedTitle, 1);
        const results = (data?.results || []).filter((m) => m.id !== seed.movieId).slice(0, 15);

        setSuggestionSeedTitle(seedTitle);
        setSuggestedMovies(results);
      } catch (e) {
        console.error('Failed to load suggestions', e);
        setSuggestedMovies([]);
        setSuggestionSeedTitle('');
      }
    };

    loadSuggestions();
  }, [favorites]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (movieId) => {
    setFavorites(prevFavorites => {
      const movieIdStr = movieId.toString();
      const exists = prevFavorites.some(fav => fav.movieId === movieIdStr);
      
      if (exists) {
        // Remove from favorites
        return prevFavorites.filter(fav => fav.movieId !== movieIdStr);
      } else {
        // Add to favorites (will be updated on next favorites fetch)
        return prevFavorites;
      }
    });
  };

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 pb-10 pt-12 sm:pt-20 md:pt-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero Slider */}
        <section className="mb-6 sm:mb-12">
          <TrendingSlider />
        </section>

        {/* New Releases Grid */}
        {!loading && newReleases.length > 0 && (
          <section className="mb-12">
            <MovieGrid
              movies={newReleases}
              title="🎬 New Releases (In Theaters Now)"
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </section>
        )}

        {/* Upcoming Movies Grid */}
        {!loading && upcomingMovies.length > 0 && (
          <section className="mb-12">
            <MovieGrid
              movies={upcomingMovies}
              title="🔜 Upcoming Movies"
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </section>
        )}

        {/* Personalized suggestions (live, based on favorites & TMDB search) */}
        {!loading && suggestedMovies.length > 0 && (
          <section className="mb-12">
            <MovieGrid
              movies={suggestedMovies}
              title={suggestionSeedTitle ? `Because you liked "${suggestionSeedTitle}"` : 'Recommended For You'}
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </section>
        )}

        {/* Trending Movies Grid */}
        <section>
          {loading ? (
            <Loader size="large" />
          ) : (
            <MovieGrid
              movies={trendingMovies}
              title="Trending Movies"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;