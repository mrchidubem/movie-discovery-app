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
          getNowPlaying(1, true),
          getUpcoming(1, true),
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

  // Personalized suggestions based on a random favorite title
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!favorites || favorites.length === 0) {
        setSuggestedMovies([]);
        setSuggestionSeedTitle('');
        return;
      }

      try {
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFavoriteToggle = (movieId) => {
    setFavorites((prevFavorites) => {
      const movieIdStr = movieId.toString();
      const exists = prevFavorites.some((fav) => fav.movieId === movieIdStr);

      if (exists) {
        return prevFavorites.filter((fav) => fav.movieId !== movieIdStr);
      } else {
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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Hero Slider – compact on mobile, starts right under navbar */}
      <section className="relative -mt-16 md:-mt-20 mb-6 md:mb-12 overflow-hidden">
        <div className="h-[45vh] max-h-[480px] w-full md:h-[65vh] md:max-h-[720px]">
          <TrendingSlider />
        </div>
      </section>

      {/* Main content container – responsive padding */}
      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pb-12 md:pb-20">
        {/* New Releases */}
        {!loading && newReleases.length > 0 && (
          <section className="mb-8 md:mb-12">
            <MovieGrid
              movies={newReleases}
              title="🎬 New Releases (In Theaters Now)"
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </section>
        )}

        {/* Upcoming */}
        {!loading && upcomingMovies.length > 0 && (
          <section className="mb-8 md:mb-12">
            <MovieGrid
              movies={upcomingMovies}
              title="🔜 Upcoming Movies"
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </section>
        )}

        {/* Personalized Suggestions */}
        {!loading && suggestedMovies.length > 0 && (
          <section className="mb-8 md:mb-12">
            <MovieGrid
              movies={suggestedMovies}
              title={suggestionSeedTitle ? `Because you liked "${suggestionSeedTitle}"` : 'Recommended For You'}
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </section>
        )}

        {/* Trending Movies */}
        <section className="pb-6 md:pb-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="large" />
            </div>
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