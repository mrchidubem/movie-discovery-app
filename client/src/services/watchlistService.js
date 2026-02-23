import api from './api';

/**
 * Get all watchlist items
 * @returns {Promise<Array>} - User's watchlist
 */
export const getWatchlist = async () => {
  try {
    const { data } = await api.get('/api/watchlist');
    return data;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
};

/**
 * Add movie to watchlist
 * @param {Object} movie - Movie data to add
 * @returns {Promise<Object>} - Added watchlist item
 */
export const addToWatchlist = async (movie) => {
  try {
    const { data } = await api.post('/api/watchlist', {
      movieId: movie.movieId || movie.id,
      title: movie.title,
      poster: movie.poster || movie.poster_path,
      overview: movie.overview,
      rating: movie.rating || movie.vote_average,
      releaseDate: movie.releaseDate || movie.release_date
    });
    return data;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
};

/**
 * Remove movie from watchlist
 * @param {string|number} movieId - Movie ID
 * @returns {Promise<Object>} - Response message
 */
export const removeFromWatchlist = async (movieId) => {
  try {
    const { data } = await api.delete(`/api/watchlist/${movieId}`);
    return data;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
};
