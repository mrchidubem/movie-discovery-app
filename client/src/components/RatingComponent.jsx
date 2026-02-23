import { useState, useEffect } from 'react';
import { FaStar, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RatingComponent = ({ movieId, movieTitle }) => {
  const { isAuthenticated, user } = useAuth();
  const [userRating, setUserRating] = useState(null);
  const [allRatings, setAllRatings] = useState({ ratings: [], avgRating: 0, count: 0 });
  const [reviewText, setReviewText] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRatings();
    if (isAuthenticated) fetchUserRating();
  }, [movieId, isAuthenticated]);

  const fetchRatings = async () => {
    try {
      const res = await api.get(`/api/ratings/movie/${movieId}`);
      setAllRatings(res.data);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchUserRating = async () => {
    try {
      const res = await api.get(`/api/ratings/user/${movieId}`);
      const data = res.data;
      if (data) {
        setUserRating(data);
        setReviewText(data.review || '');
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const handleSubmitRating = async (rating) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const res = await api.post('/api/ratings', {
        movieId,
        rating,
        review: reviewText,
        title: movieTitle,
      });

      const data = res.data;
      setUserRating(data);
      fetchRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Community Rating */}
      <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
        <h3 className="mb-4 text-xl font-bold">Community Rating</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-secondary">{allRatings.avgRating}</div>
          <div>
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map(i => (
                <FaStar key={i} size={20} className={i <= Math.round(allRatings.avgRating) ? '' : 'opacity-30'} />
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{allRatings.count} ratings</p>
          </div>
        </div>
      </div>

      {/* User Rating */}
      {isAuthenticated && (
        <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <h3 className="mb-4 text-xl font-bold">Your Rating</h3>
          
          <div className="mb-4 flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => handleSubmitRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform hover:scale-110"
              >
                <FaStar
                  size={32}
                  className={star <= (hoveredStar || userRating?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}
                />
              </button>
            ))}
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your review (optional)..."
            className="mb-3 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700"
            rows="4"
          />

          <button
            onClick={() => handleSubmitRating(userRating?.rating || 3)}
            disabled={loading}
            className="rounded-lg bg-secondary px-6 py-2 font-medium text-white hover:bg-secondary/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : userRating ? 'Update Rating' : 'Submit Rating'}
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <p className="text-center text-gray-500">Log in to rate this movie</p>
      )}

      {/* Recent Reviews */}
      {allRatings.ratings?.length > 0 && (
        <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
          <h3 className="mb-4 text-xl font-bold">Recent Reviews</h3>
          <div className="space-y-4">
            {allRatings.ratings.slice(0, 5).map(r => (
              <div key={r._id} className="rounded bg-white p-3 dark:bg-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">{r.userId?.username || 'Anonymous'}</span>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <FaStar key={i} size={12} className={i < r.rating ? '' : 'opacity-30'} />)}
                  </div>
                </div>
                {r.review && <p className="text-sm text-gray-600 dark:text-gray-400">{r.review}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingComponent;
