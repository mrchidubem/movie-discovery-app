import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaStar, FaPlay, FaInfo } from 'react-icons/fa';
import { getTrending, getImageUrl } from '../services/tmdbApi';
import Loader from './Loader';

const TrendingSlider = () => {
  const [moviesPool, setMoviesPool] = useState([]); // larger rotating pool
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);
  const poolRef = useRef(moviesPool);
  const indexRef = useRef(currentIndex);
  const touchStartX = useRef(null); // for simple swipe support
  const touchThreshold = 50; // pixels

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const data = await getTrending(1, true); // initial cache-bust
        // Keep a larger rotating pool so the slider feels live
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
    // Auto-play functionality over the pool
    if (moviesPool.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % moviesPool.length);
      }, 6000);
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [moviesPool.length]);

  // keep refs in sync so the interval can read latest values
  useEffect(() => {
    poolRef.current = moviesPool;
  }, [moviesPool]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  // Periodically refresh trending to keep the slider live (every 60s)
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const data = await getTrending(1, true); // cache-bust on periodic refresh
        if (!mounted) return;
        const newPool = (data.results || []).slice(0, 20);
        if (!newPool.length) return;

        // try to preserve the currently visible movie if it still exists
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
    }, 30000); // refresh every 30s for more real-time feel

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const goToSlide = (index) => {
    setCurrentIndex(index % Math.max(1, moviesPool.length));
    // Reset autoplay timer when manual navigation occurs
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % moviesPool.length);
      }, 6000);
    }
  };

  // touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > touchThreshold) prevSlide();
    else if (delta < -touchThreshold) nextSlide();
    touchStartX.current = null;
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, moviesPool.length));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + moviesPool.length) % Math.max(1, moviesPool.length));
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center sm:h-[50vh] md:h-[70vh]">
        <Loader size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[30vh] items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (moviesPool.length === 0) {
    return (
      <div className="flex h-[30vh] items-center justify-center text-gray-500">
        No trending movies found
      </div>
    );
  }

  return (
    <div
      className="relative h-[40vh] sm:h-[50vh] md:h-[65vh] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 sm:p-3 text-white opacity-70 transition-all hover:bg-black/50 hover:opacity-100"
        aria-label="Previous"
      >
        <FaChevronLeft size={20} />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 sm:p-3 text-white opacity-70 transition-all hover:bg-black/50 hover:opacity-100"
        aria-label="Next"
      >
        <FaChevronRight size={20} />
      </button>

      {/* Slides */}
      <div ref={sliderRef} className="h-full flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {moviesPool.map((movie) => (
          <div key={movie.id} className="flex-shrink-0 w-full h-full relative bg-black">
            <img
              src={getImageUrl(movie.backdrop_path || movie.poster_path, 'original')}
              alt={movie.title}
              className="h-full w-full object-cover"
            />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

                <div className="absolute bottom-0 left-0 w-full p-4 pb-12 sm:p-6 sm:pb-16 md:bottom-10 md:p-10 md:pb-20 lg:w-2/3 lg:pb-24">
                  <div className="animate-fadeSlideUp">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-white">Trending</span>
                      <div className="flex items-center">
                        <FaStar className="mr-1 text-yellow-500" />
                        <span className="text-white">{movie.vote_average?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>

                    <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl">{movie.title}</h2>

                    <p className="mb-4 text-xs text-gray-300 line-clamp-2 sm:text-sm md:text-base md:line-clamp-3 lg:w-3/4">{movie.overview}</p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to={`/movie/${movie.id}#watch`} className="flex items-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105 hover:bg-opacity-90">
                        <FaInfo className="mr-2" />
                        <span className="truncate">View Details</span>
                      </Link>

                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`} target="_blank" rel="noopener noreferrer" className="flex items-center rounded-full bg-white/20 px-6 py-2 font-semibold text-white backdrop-blur-sm transition-transform hover:scale-105 hover:bg-white/30">
                        <FaPlay className="mr-2" />
                        Watch Trailer
                      </a>
                    </div>
                  </div>
                </div>
            </div>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 space-x-2">
        {moviesPool.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 w-6 rounded-full transition-all ${index === currentIndex ? 'bg-secondary w-8' : 'bg-white/50 hover:bg-white/80'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// Add keyframe animation for the slide content
const styles = `
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeSlideUp {
  animation: fadeSlideUp 0.8s ease-out forwards;
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default TrendingSlider;