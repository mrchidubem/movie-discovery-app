import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { FaStar, FaHeart, FaRegHeart, FaPlay, FaExternalLinkAlt, FaImage, FaImdb, FaClock } from 'react-icons/fa';
import { getMovieDetails, getImageUrl, getWatchProviders } from '../services/tmdbApi';
import { getFavorites, addToFavorites, removeFromFavorites } from '../services/favoriteService';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/watchlistService';
import { getMovieReviews, addReview } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import MovieGrid from '../components/MovieGrid';
import RatingComponent from '../components/RatingComponent';
import SocialShareComponent from '../components/SocialShareComponent';

// Function to render an image with fallback
const ImageWithFallback = ({ src, alt, className }) => {
  if (!src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-200 ${className}`}>
        <FaImage className="h-16 w-16 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">No image available</p>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = `flex flex-col items-center justify-center bg-gray-200 ${className}`;
        placeholder.innerHTML = `
          <svg class="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" clip-rule="evenodd" />
          </svg>
          <p class="mt-2 text-sm text-gray-500">No image available</p>
        `;
        e.target.parentNode.appendChild(placeholder);
      }}
    />
  );
};

const MovieDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [watchProviders, setWatchProviders] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Review form
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('US');

  // Fetch movie details
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top when movie changes
    
    const fetchMovie = async () => {
      try {
        // Reset all state first
        setMovie(null);
        setTrailer(null);
        setCast([]);
        setCrew([]);
        setKeywords([]);
        setSimilarMovies([]);
        setReviews([]);
        setError(null);
        setLoading(true);
        
        const data = await getMovieDetails(id);
        setMovie(data);
        
        // Set trailer
        const trailerVideo = data.videos?.results?.find(
          video => video.type === 'Trailer' && video.site === 'YouTube'
        );
        setTrailer(trailerVideo);
        
        // Set cast (all cast members)
        setCast(data.credits?.cast || []);
        
        // Get directors and top producers
        const directors = data.credits?.crew?.filter(c => c.job === 'Director').slice(0, 3) || [];
        const producers = data.credits?.crew?.filter(c => c.job === 'Producer').slice(0, 2) || [];
        setCrew([...directors, ...producers]);
        
        // Set keywords
        setKeywords(data.keywords?.keywords || []);
        
        // Set similar movies
        setSimilarMovies(data.similar?.results || []);
        // Fetch watch providers
        try {
          const providers = await getWatchProviders(id);
          setWatchProviders(providers || {});
        } catch (e) {
          console.error('Failed to fetch watch providers', e);
        }
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setError('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
    
    // Auto-detect user's country
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code && data.country_code.length === 2) {
          setSelectedRegion(data.country_code);
        }
      } catch (e) {
        console.log('Could not auto-detect country, defaulting to US');
        setSelectedRegion('US');
      }
    };
    
    detectCountry();
  }, [id]);

  // Fetch favorites and check if movie is favorited
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const favData = await getFavorites();
          setFavorites(favData);
          const isFav = favData.some(fav => fav.movieId === id);
          setIsFavorite(isFav);

          // Fetch watchlist
          const watchData = await getWatchlist();
          setWatchlist(watchData);
          const inWatch = watchData.some(w => w.movieId === id);
          setIsInWatchlist(inWatch);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchData();
    }
  }, [isAuthenticated, id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getMovieReviews(id);
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, [id]);

  // If URL contains #watch (or any hash), scroll to the watch section after movie loads
  useEffect(() => {
    if (!location.hash) return;
    const hash = location.hash.replace('#', '');
    // small timeout to allow DOM to render
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, [location.hash, movie]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !movie) return;

    try {
      if (isFavorite) {
        await removeFromFavorites(id);
        setIsFavorite(false);
      } else {
        await addToFavorites({
          movieId: id,
          title: movie.title,
          poster: movie.poster_path,
          overview: movie.overview,
          rating: movie.vote_average,
          releaseDate: movie.release_date
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Toggle watchlist
  const handleToggleWatchlist = async () => {
    if (!isAuthenticated || !movie) return;

    try {
      if (isInWatchlist) {
        await removeFromWatchlist(id);
        setIsInWatchlist(false);
      } else {
        await addToWatchlist({
          movieId: id,
          title: movie.title,
          poster: movie.poster_path,
          overview: movie.overview,
          rating: movie.vote_average,
          releaseDate: movie.release_date
        });
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated || submittingReview) return;
    
    try {
      setSubmittingReview(true);
      
      await addReview({
        movieId: id,
        title: reviewTitle,
        comment: reviewComment,
        rating: parseInt(reviewRating)
      });
      
      // Reset form and fetch updated reviews
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setReviewFormVisible(false);
      
      // Refresh reviews
      const updatedReviews = await getMovieReviews(id);
      setReviews(updatedReviews);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <Loader size="large" />;
  }

  if (error || !movie) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        <p>{error || 'Movie not found'}</p>
      </div>
    );
  }

  const {
    title,
    poster_path,
    backdrop_path,
    overview,
    vote_average,
    vote_count,
    release_date,
    runtime,
    genres,
    homepage
  } = movie;

  const releaseYear = release_date ? new Date(release_date).getFullYear() : 'N/A';
  const backdropUrl = backdrop_path 
    ? getImageUrl(backdrop_path, 'original')
    : poster_path
      ? getImageUrl(poster_path, 'original')
      : null;

  return (
    <div>
      {/* Movie backdrop */}
      {backdropUrl && (
        <div className="relative mb-8 h-[40vh] w-full overflow-hidden md:h-[60vh]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Movie info overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="container grid gap-6 px-4 text-white md:grid-cols-3">
              {/* Poster */}
              <div className="hidden md:block">
                <ImageWithFallback
                  src={poster_path ? getImageUrl(poster_path) : null}
                  alt={`${title} poster`}
                  className="mx-auto h-auto max-w-full rounded-lg shadow-lg"
                />
              </div>
              
              {/* Details */}
              <div className="md:col-span-2">
                <h1 className="text-3xl font-bold md:text-4xl">
                  {title} <span className="text-xl opacity-75">({releaseYear})</span>
                </h1>
                
                <div className="mt-4 flex flex-wrap gap-3">
                  {genres?.map(genre => (
                    <span key={genre.id} className="rounded-full bg-secondary px-3 py-1 text-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
                
                <div className="mt-4 flex items-center gap-6">
                  <div className="flex items-center">
                    <FaStar className="mr-1 text-yellow-500" />
                    <span className="text-lg font-semibold">{vote_average?.toFixed(1)}</span>
                    <span className="ml-1 text-sm opacity-75">({vote_count} votes)</span>
                  </div>
                  
                  {runtime && (
                    <div>
                      <span className="text-lg">{Math.floor(runtime / 60)}h {runtime % 60}m</span>
                    </div>
                  )}
                </div>

                {/* Directors & Producers */}
                {crew.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {crew.map(person => (
                      <div key={`${person.id}-${person.job}`} className="text-sm">
                        <span className="font-semibold opacity-75">{person.job}:</span>
                        <span className="ml-2">{person.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Keywords */}
                {keywords.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {keywords.slice(0, 5).map(keyword => (
                      <span key={keyword.id} className="rounded bg-secondary/30 px-2 py-1 text-xs opacity-75">
                        {keyword.name}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="mt-4 text-lg">{overview}</p>
                
                <div className="mt-6 flex flex-wrap gap-3">
                  {trailer && (
                    <a
                      href={`https://www.youtube.com/watch?v=${trailer.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center rounded-md bg-red-600 px-4 py-2 font-medium hover:bg-red-700"
                    >
                      <FaPlay className="mr-2" />
                      Watch Trailer
                    </a>
                  )}
                  
                  {homepage && (
                    <a
                      href={homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center rounded-md bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700"
                    >
                      <FaExternalLinkAlt className="mr-2" />
                      Official Site
                    </a>
                  )}

                  {/* IMDb Link */}
                  {movie.imdb_id && (
                    <a
                      href={`https://www.imdb.com/title/${movie.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center rounded-md bg-yellow-600 px-4 py-2 font-medium hover:bg-yellow-700"
                    >
                      <FaImdb className="mr-2" />
                      IMDb
                    </a>
                  )}

                  {/* Rotten Tomatoes Link */}
                  <a
                    href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center rounded-md bg-red-700 px-4 py-2 font-medium hover:bg-red-800"
                  >
                    <FaExternalLinkAlt className="mr-2" />
                    Rotten Tomatoes
                  </a>
                  
                  {isAuthenticated && (
                    <>
                      <button
                        onClick={handleToggleFavorite}
                        className={`flex items-center rounded-md px-4 py-2 font-medium ${
                          isFavorite
                            ? 'bg-pink-600 hover:bg-pink-700'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {isFavorite ? (
                          <>
                            <FaHeart className="mr-2" />
                            Favorited
                          </>
                        ) : (
                          <>
                            <FaRegHeart className="mr-2" />
                            Add to Favorites
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleToggleWatchlist}
                        className={`flex items-center rounded-md px-4 py-2 font-medium ${
                          isInWatchlist
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {isInWatchlist ? (
                          <>
                            <FaClock className="mr-2" />
                            In Watchlist
                          </>
                        ) : (
                          <>
                            <FaClock className="mr-2" />
                            Add to Watchlist
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-7xl px-4">
        {/* Production & Box Office Info */}
        {(movie.production_companies?.length > 0 || movie.budget || movie.revenue) && (
          <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Production Companies */}
            {movie.production_companies?.length > 0 && (
              <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold">Production Companies</h3>
                <div className="space-y-3">
                  {movie.production_companies.slice(0, 3).map(company => (
                    <div key={company.id} className="text-sm">
                      {company.logo_path && (
                        <img 
                          src={getImageUrl(company.logo_path, 'w100')} 
                          alt={company.name}
                          className="mb-2 h-8 object-contain"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <p className="font-medium">{company.name}</p>
                      {company.origin_country && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">{company.origin_country}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget */}
            {movie.budget > 0 && (
              <div className="rounded-lg bg-blue-100 p-6 dark:bg-blue-900/30">
                <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-200">Budget</h3>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  ${(movie.budget / 1000000).toFixed(1)}M
                </p>
              </div>
            )}

            {/* Revenue / Box Office */}
            {movie.revenue > 0 && (
              <div className="rounded-lg bg-green-100 p-6 dark:bg-green-900/30">
                <h3 className="mb-2 text-lg font-semibold text-green-900 dark:text-green-200">Box Office</h3>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ${(movie.revenue / 1000000).toFixed(1)}M
                </p>
              </div>
            )}
          </section>
        )}

        {/* Where to Watch – always visible so every clicked movie has a clear entry point */}
        <section id="watch" className="mb-12">
          <h2 className="mb-6 text-3xl font-bold">🎬 Where to Watch</h2>
          <div className="rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 p-8 dark:from-gray-800 dark:to-gray-900">
            {Object.keys(watchProviders || {}).length === 0 ? (
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p>We couldn&apos;t find streaming availability data for this title right now.</p>
                <p>
                  You can still check live availability via TMDB or other provider search:
                </p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <a
                    href={`https://www.themoviedb.org/movie/${id}/watch`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-secondary px-4 py-2 text-xs font-semibold text-white hover:bg-secondary/90"
                  >
                    View on TMDB &amp; Providers
                  </a>
                  <a
                    href={`https://www.justwatch.com/search?q=${encodeURIComponent(title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-gray-800 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-900"
                  >
                    Search on JustWatch
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Region Selector */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Select Your Region:
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {Object.keys(watchProviders)
                      .sort()
                      .map((code) => (
                        <option key={code} value={code}>
                          {new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Provider Information */}
                {(() => {
                  const country = watchProviders[selectedRegion] || watchProviders['US'];
                  if (!country) {
                    return (
                      <p className="text-gray-600 dark:text-gray-400">
                        No provider information available for this region.
                      </p>
                    );
                  }

                  const sections = [
                    { key: 'flatrate', label: '🎥 Streaming (Watch Now)' },
                    { key: 'rent', label: '🎫 Rent' },
                    { key: 'buy', label: '💳 Buy' },
                  ];

                  const hasAnyProviders = sections.some((s) => (country[s.key] || []).length > 0);
                  if (!hasAnyProviders) {
                    return (
                      <p className="text-gray-600 dark:text-gray-400">
                        No streaming options available in{' '}
                        {new Intl.DisplayNames(['en'], { type: 'region' }).of(selectedRegion) ||
                          selectedRegion}
                        .
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {sections.map((s) => {
                        const list = country[s.key] || [];
                        if (list.length === 0) return null;
                        return (
                          <div key={s.key}>
                            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                              {s.label}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                              {list.map((provider) => (
                                <div
                                  key={provider.provider_id}
                                  className="group relative flex flex-col items-center rounded-lg border-2 border-gray-200 bg-white p-4 shadow-md transition-all hover:border-secondary hover:shadow-lg dark:border-gray-600 dark:bg-gray-700"
                                >
                                  {provider.logo_path ? (
                                    <img
                                      src={getImageUrl(provider.logo_path, 'w92')}
                                      alt={provider.provider_name}
                                      className="mb-2 h-16 w-16 object-contain transition-transform group-hover:scale-110"
                                      onError={(e) => (e.target.style.display = 'none')}
                                    />
                                  ) : null}
                                  <span className="line-clamp-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                                    {provider.provider_name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </section>

        {/* Production Crew Section */}
        {crew.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">Production Team</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {crew.map(person => (
                <div key={`${person.id}-${person.job}`} className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                  <div className="text-sm font-semibold text-secondary">{person.job}</div>
                  <div className="mt-1 text-lg font-medium">{person.name}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cast section */}
        {cast.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Top Cast</h2>
              {cast.length > 10 && (
                <button
                  onClick={() => setShowAllCast(!showAllCast)}
                  className="text-sm font-medium text-secondary hover:underline"
                >
                  {showAllCast ? 'Show Less' : `View All (${cast.length})`}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {(showAllCast ? cast : cast.slice(0, 10)).map(person => (
                <div key={person.id} className="text-center">
                  <div className="mx-auto mb-2 h-40 w-40 overflow-hidden rounded-full">
                    <ImageWithFallback
                      src={
                        person.profile_path
                          ? getImageUrl(person.profile_path, 'w185')
                          : null
                      }
                      alt={person.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold">{person.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trailer section */}
        {trailer && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">Trailer</h2>
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={`${title} Trailer`}
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              ></iframe>
            </div>
          </section>
        )}

        {/* Reviews section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Reviews</h2>
            {isAuthenticated && !reviewFormVisible && (
              <button
                onClick={() => setReviewFormVisible(true)}
                className="rounded-md bg-secondary px-4 py-2 text-white hover:bg-opacity-90"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review form */}
          {isAuthenticated && reviewFormVisible && (
            <div className="mb-8 rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
              <h3 className="mb-4 text-xl font-semibold">Write Your Review</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label htmlFor="reviewTitle" className="mb-1 block font-medium">
                    Title
                  </label>
                  <input
                    id="reviewTitle"
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    required
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="reviewComment" className="mb-1 block font-medium">
                    Comment
                  </label>
                  <textarea
                    id="reviewComment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    rows={4}
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary dark:border-gray-700 dark:bg-gray-900"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="reviewRating" className="mb-1 block font-medium">
                    Rating: {reviewRating}/10
                  </label>
                  <input
                    id="reviewRating"
                    type="range"
                    min="1"
                    max="10"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                    className="w-full accent-secondary"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setReviewFormVisible(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="rounded-md bg-secondary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-70"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="rounded-lg bg-gray-100 p-6 text-center dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-400">
                No reviews yet. Be the first to review this movie!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{review.title}</h3>
                    <div className="flex items-center">
                      <FaStar className="mr-1 text-yellow-500" />
                      <span>{review.rating}/10</span>
                    </div>
                  </div>
                  <p className="mb-2 text-gray-700 dark:text-gray-300">{review.comment}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{review.user.name}</span>
                    <span>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Rating & Reviews Component */}
        <section className="mb-12">
          <RatingComponent movieId={id} movieTitle={title} />
        </section>

        {/* Social Share Component */}
        <section className="mb-12">
          <SocialShareComponent movie={{ id, title }} />
        </section>

        {/* Similar movies section */}
        {similarMovies.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">Similar Movies</h2>
            <MovieGrid 
              movies={similarMovies} 
              favorites={favorites}
              onFavoriteToggle={() => {}} 
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default MovieDetails; 