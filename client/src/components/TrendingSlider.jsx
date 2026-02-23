import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaStar, FaPlay, FaInfo } from 'react-icons/fa';
import { getTrending, getImageUrl } from '../services/tmdbApi';
import Loader from './Loader';

const TrendingSlider = () => {
  const [moviesPool, setMoviesPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);
  const poolRef = useRef(moviesPool);
  const indexRef = useRef(currentIndex);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const data = await getTrending(1, true);
        const pool = (data.results || []).slice(0, 20);
        setMoviesPool(pool);
      } catch (error) {
        console.error('Error fetching trending movies:', error);
        setError('Failed to load trending movies');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  useEffect(() => {
    if (moviesPool.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % moviesPool.length);
      }, 7000); // Slightly slower for premium feel
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [moviesPool.length]);

  useEffect(() => {
    poolRef.current = moviesPool;
  }, [moviesPool]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const data = await getTrending(1, true);
        if (!mounted) return;
        const newPool = (data.results || []).slice(0, 20);
        if (!newPool.length) return;

        const activeId = poolRef.current?.[indexRef.current]?.id;
        let newIndex = 0;
        if (activeId) {
          const idx = newPool.findIndex((m) => m.id === activeId);
          newIndex = idx >= 0 ? idx : 0;
        }

        setMoviesPool(newPool);
        setCurrentIndex(newIndex);
      } catch (e) {
        console.error('Periodic trending fetch failed', e);
      }
    }, 45000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const goToSlide = (index) => {
    setCurrentIndex(index % Math.max(1, moviesPool.length));
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % moviesPool.length);
      }, 7000);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, moviesPool.length));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + moviesPool.length) % Math.max(1, moviesPool.length));
  };

  if (loading) {
    return (
      <div className="flex h-[42vh] items-center justify-center md:h-[70vh]">
        <Loader size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[30vh] items-center justify-center text-red-500 text-lg font-medium">
        {error}
      </div>
    );
  }

  if (moviesPool.length === 0) {
    return (
      <div className="flex h-[30vh] items-center justify-center text-gray-400 text-lg font-medium">
        No trending movies available
      </div>
    );
  }

  return (
    <div className="relative h-[42vh] overflow-hidden md:h-[70vh]">
      {/* Navigation arrows – desktop only */}
      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-6 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-4 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-110 hover:shadow-xl"
        aria-label="Previous slide"
      >
        <FaChevronLeft size={32} />
      </button>

      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-6 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-4 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-110 hover:shadow-xl"
        aria-label="Next slide"
      >
        <FaChevronRight size={32} />
      </button>

      {/* Slides */}
      <div ref={sliderRef} className="h-full">
        {moviesPool.map((movie, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={movie.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <div
                className="h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${getImageUrl(movie.backdrop_path || movie.poster_path, 'original')})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent"></div>

                {/* Hero content – spacious & professional on mobile */}
                <div className="absolute inset-0 flex flex-col justify-end px-5 pb-10 sm:px-8 sm:pb-14 md:pb-20 lg:px-16 lg:pb-24">
                  <div className="max-w-4xl animate-fadeSlideUp space-y-4 sm:space-y-6">
                    {/* Badge + rating */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <span className="rounded-full bg-gradient-to-r from-secondary to-indigo-600 px-3 py-1.5 text-xs sm:text-sm font-bold text-white shadow-md">
                        Trending Now
                      </span>
                      <div className="flex items-center gap-2 text-white">
                        <FaStar className="text-yellow-400 text-xl sm:text-2xl" />
                        <span className="text-base sm:text-lg font-medium">
                          {movie.vote_average?.toFixed(1) || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Title – bold & standout */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-2xl line-clamp-2 leading-tight">
                      {movie.title}
                    </h2>

                    {/* Overview – more readable */}
                    <p className="text-sm sm:text-base md:text-lg text-gray-200 line-clamp-3 drop-shadow-md">
                      {movie.overview}
                    </p>

                    {/* Buttons – stacked on mobile, spacious, no cutting */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-4 sm:mt-6 max-w-[90%]">
                      <Link
                        to={`/movie/${movie.id}#watch`}
                        className="flex items-center justify-center rounded-xl bg-gradient-to-r from-secondary to-indigo-600 px-6 py-3 text-base sm:text-lg font-semibold text-white shadow-xl transition-all hover:scale-[1.04] hover:shadow-2xl active:scale-95 backdrop-blur-sm ring-1 ring-white/20"
                      >
                        <FaInfo className="mr-2.5 text-xl sm:text-2xl" />
                        View Details
                      </Link>

                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' official trailer')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-xl bg-white/15 px-6 py-3 text-base sm:text-lg font-semibold text-white backdrop-blur-xl border border-white/20 shadow-xl transition-all hover:bg-white/25 hover:scale-[1.04] active:scale-95"
                      >
                        <FaPlay className="mr-2.5 text-xl sm:text-2xl" />
                        Watch Trailer
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots – only on desktop, hidden on mobile for clean look */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 z-10 -translate-x-1/2 space-x-3">
        {moviesPool.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3.5 w-9 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-gradient-to-r from-secondary to-indigo-600 scale-110 shadow-lg'
                : 'bg-white/50 hover:bg-white/80 hover:scale-110'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// Animation
const styles = `
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(60px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeSlideUp {
  animation: fadeSlideUp 1.2s ease-out forwards;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default TrendingSlider;