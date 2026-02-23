import { Link, useNavigate } from 'react-router-dom';
import { FaStar, FaHeart, FaRegHeart, FaCalendarAlt, FaPlayCircle, FaImage, FaClock } from 'react-icons/fa';
import { getImageUrl } from '../services/tmdbApi';
import { useAuth } from '../context/AuthContext';
import { addToFavorites, removeFromFavorites } from '../services/favoriteService';
import { showToast } from './ToastContainer';

const MovieCard = ({ movie, isFavorite, onFavoriteToggle }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    id,
    title,
    poster_path,
    vote_average,
    release_date,
  } = movie;

  const releaseYear = release_date ? new Date(release_date).getFullYear() : 'N/A';
  const rating = vote_average ? vote_average.toFixed(1) : 'N/A';

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please login to add favorites', 'info');
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(id);
        showToast(`Removed "${title}" from favorites`, 'success');
      } else {
        await addToFavorites({
          movieId: id.toString(),
          title,
          poster: poster_path,
          overview: movie.overview,
          rating: vote_average,
          releaseDate: release_date,
        });
        showToast(`Added "${title}" to favorites`, 'success');
      }

      if (onFavoriteToggle) {
        onFavoriteToggle(id);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showToast('Failed to update favorites', 'error');
    }
  };

  const handleWatchLaterClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Add your Watch Later logic here
    showToast(`Added "${title}" to Watch Later`, 'info');
    // Example: navigate(`/movie/${id}#watch`) or call API
  };

  const handleCardClick = () => {
    navigate(`/movie/${id}#watch`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative block h-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] dark:bg-gray-800"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {poster_path ? (
          <img
            src={getImageUrl(poster_path, 'w500')}
            alt={`${title} poster`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gray-200 dark:bg-gray-700">
            <FaImage className="h-16 w-16 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No poster</p>
          </div>
        )}

        {/* Overlay gradient + play icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/80 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
              <FaPlayCircle className="text-3xl ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons – moved up (bottom-4), full visibility, no cut-off */}
      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-3 px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {/* Watch Later button – raised position, rounded full */}
        <button
          onClick={handleWatchLaterClick}
          className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-black/90 hover:scale-105 active:scale-95 shadow-md"
          title="Add to Watch Later"
        >
          <FaClock className="text-lg" />
          <span className="hidden sm:inline">Watch Later</span>
        </button>

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/70 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-md ${
            isFavorite ? 'text-red-500 hover:text-red-400' : 'text-white hover:text-red-400'
          }`}
          title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          {isFavorite ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
        </button>
      </div>

      {/* Movie info – extra bottom padding to prevent overlap */}
      <div className="p-4 pb-6">
        <h3 className="mb-1 text-lg font-semibold line-clamp-2 text-gray-900 dark:text-white group-hover:text-secondary transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <FaCalendarAlt className="text-secondary" />
            <span>{releaseYear}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaStar className="text-yellow-400" />
            <span>{rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;