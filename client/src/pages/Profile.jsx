import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEdit, FaEnvelope, FaCalendarAlt, FaFilm, FaStar, FaSignOutAlt, FaCamera, FaTrophy, FaDownload } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getFavorites } from '../services/favoriteService';
import { getUserReviews, updateUserProfile } from '../services/userService';
import { getCurrentUserBadges } from '../services/badgeService';
import { getImageUrl } from '../services/tmdbApi';
import Loader from '../components/Loader';
import MovieCard from '../components/MovieCard';
import BadgeDisplay from '../components/BadgeDisplay';
import { showToast } from '../components/ToastContainer';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [badges, setBadges] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    displayName: '',
    photoURL: '',
  });
  const [fileUpload, setFileUpload] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Sync userInfo when user changes (important after login or profile update)
  useEffect(() => {
    if (user) {
      setUserInfo({
        displayName: user.name || user.displayName || '',
        photoURL: user.avatar || user.photoURL || 'https://via.placeholder.com/150?text=User',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        navigate('/login'); // or '/' – adjust as needed
        return;
      }

      setLoading(true);
      try {
        const [favoritesData, reviewsData, badgesData] = await Promise.all([
          getFavorites(),
          getUserReviews(user._id),
          getCurrentUserBadges(),
        ]);

        setFavorites(favoritesData || []);
        setReviews(reviewsData || []);
        setBadges(badgesData || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showToast('error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user?._id) return;

    setLoading(true);
    try {
      const updatedUser = await updateUserProfile(user._id, userInfo, fileUpload);

      // Update both local state and AuthContext
      setUserInfo({
        displayName: updatedUser.displayName || updatedUser.name || '',
        photoURL: updatedUser.photoURL || userInfo.photoURL,
      });

      // Update the user in AuthContext so it persists across navigation
      updateUser({
        displayName: updatedUser.displayName || updatedUser.name,
        photoURL: updatedUser.photoURL,
        avatar: updatedUser.photoURL || updatedUser.avatar,
      });

      setFileUpload(null);
      setIsEditing(false);
      showToast('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      showToast('error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileUpload(file);
      setUserInfo((prev) => ({
        ...prev,
        photoURL: URL.createObjectURL(file),
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      showToast('success', 'Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('error', 'Logout failed');
    }
  };

  const handleExportReviewsAsText = () => {
    if (reviews.length === 0) {
      showToast('error', 'No reviews to export');
      return;
    }

    let content = `MOVIEVERSE REVIEWS EXPORT\n`;
    content += `User: ${userInfo.displayName || 'User'}\n`;
    content += `Export Date: ${new Date().toLocaleDateString()}\n`;
    content += `Total Reviews: ${reviews.length}\n`;
    content += `${'='.repeat(60)}\n\n`;

    reviews.forEach((review, index) => {
      content += `REVIEW ${index + 1}\n`;
      content += `-${'-'.repeat(58)}\n`;
      content += `Movie: ${review.movie?.title || 'Unknown Movie'}\n`;
      content += `Rating: ${'⭐'.repeat(review.rating || 0)}${' ☆'.repeat(5 - (review.rating || 0))} (${review.rating || 0}/5)\n`;
      content += `Title: ${review.title}\n`;
      content += `Date: ${new Date(review.createdAt).toLocaleDateString()}\n`;
      content += `\nReview:\n${review.content}\n`;
      content += `\n${'='.repeat(60)}\n\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', `movieverse-reviews-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('success', 'Reviews exported successfully');
  };

  const handleExportReviewsAsJSON = () => {
    if (reviews.length === 0) {
      showToast('error', 'No reviews to export');
      return;
    }

    const exportData = {
      user: userInfo.displayName,
      exportDate: new Date().toISOString(),
      totalReviews: reviews.length,
      reviews: reviews.map(review => ({
        movieTitle: review.movie?.title || 'Unknown',
        movieId: review.movieId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt,
      })),
    };

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`
    );
    element.setAttribute('download', `movieverse-reviews-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('success', 'Reviews exported as JSON');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  if (!user) return null; // safety – should never reach here

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
          {/* Profile Header */}
          <div className="relative h-40 bg-gradient-to-r from-primary to-secondary md:h-60">
            <div className="absolute -bottom-16 left-8 md:left-12">
              <div className="relative">
                <img
                  src={userInfo.photoURL}
                  alt={userInfo.displayName || 'User'}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-48 lg:w-48"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=User'; }}
                />
                {isEditing && (
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-2 right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-secondary text-white hover:bg-secondary/80"
                  >
                    <FaCamera />
                    <input
                      type="file"
                      id="photo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="absolute bottom-4 right-8">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center rounded-full bg-white px-4 py-2 font-medium text-gray-800 shadow transition-colors hover:bg-gray-100"
                >
                  <FaEdit className="mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-full bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileUpdate}
                    className="rounded-full bg-secondary px-4 py-2 font-medium text-white hover:bg-secondary/80"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 mt-16 flex border-b border-gray-200 pl-8 pt-4 dark:border-gray-700 sm:mt-20 md:pl-12">
            {/* Stats Cards */}
            <div className="mb-8 grid w-full grid-cols-1 gap-4 px-8 sm:grid-cols-3 md:px-12">
              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:from-blue-900/30 dark:to-blue-800/30">
                <div className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">Favorites</div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-200">{favorites.length}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400">movies saved</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-6 dark:from-purple-900/30 dark:to-purple-800/30">
                <div className="mb-2 text-sm font-medium text-purple-600 dark:text-purple-400">Reviews</div>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-200">{reviews.length}</div>
                <p className="text-xs text-purple-600 dark:text-purple-400">reviews written</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6 dark:from-green-900/30 dark:to-green-800/30">
                <div className="mb-2 text-sm font-medium text-green-600 dark:text-green-400">Avg Rating</div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-200">
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">of all reviews</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex border-b border-gray-200 pl-8 pt-4 dark:border-gray-700 md:pl-12">
            <button
              className={`mr-4 border-b-2 pb-4 pt-2 font-medium ${
                activeTab === 'profile'
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <FaUser className="mr-2 inline-block" />
              Profile
            </button>
            <button
              className={`mr-4 border-b-2 pb-4 pt-2 font-medium ${
                activeTab === 'badges'
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('badges')}
            >
              <FaTrophy className="mr-2 inline-block" />
              Achievements ({badges.length})
            </button>
            <button
              className={`mr-4 border-b-2 pb-4 pt-2 font-medium ${
                activeTab === 'favorites'
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('favorites')}
            >
              <FaFilm className="mr-2 inline-block" />
              Favorites
            </button>
            <button
              className={`mr-4 border-b-2 pb-4 pt-2 font-medium ${
                activeTab === 'reviews'
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              <FaStar className="mr-2 inline-block" />
              Reviews
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">Profile Information</h2>

              {isEditing ? (
                <form className="space-y-6" onSubmit={handleProfileUpdate}>
                  <div>
                    <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={userInfo.displayName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {/* You can add more editable fields here later */}
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
                      <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Display Name</div>
                      <div className="flex items-center text-lg font-medium text-gray-900 dark:text-white">
                        <FaUser className="mr-2 text-secondary" />
                        {userInfo.displayName || 'Not set'}
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
                      <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</div>
                      <div className="flex items-center text-lg font-medium text-gray-900 dark:text-white">
                        <FaEnvelope className="mr-2 text-secondary" />
                        {user?.email || 'Not available'}
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
                      <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</div>
                      <div className="flex items-center text-lg font-medium text-gray-900 dark:text-white">
                        <FaCalendarAlt className="mr-2 text-secondary" />
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : 'Not available'}
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
                      <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Account Stats</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Favorites</div>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">{favorites.length}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Reviews</div>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">{reviews.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      onClick={handleLogout}
                      className="flex items-center rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="p-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">Your Favorite Movies</h2>

              {favorites.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-700">
                  <p className="text-lg text-gray-500 dark:text-gray-300">
                    You haven't added any favorites yet.
                  </p>
                  <button
                    onClick={() => navigate('/search')}
                    className="mt-4 rounded-lg bg-secondary px-6 py-2 font-medium text-white hover:bg-secondary/80"
                  >
                    Discover Movies
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {favorites.map((movie) => (
                    <MovieCard
                      key={movie.id || movie.movieId}
                      movie={movie}
                      isFavorite={true}
                      onFavoriteToggle={() => {}} // ← add real toggle logic later
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="p-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">Your Achievements</h2>
              
              {badges.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-700">
                  <FaTrophy className="mx-auto mb-4 text-5xl text-gray-300" />
                  <p className="text-lg text-gray-500 dark:text-gray-300">
                    You haven't earned any achievements yet.
                  </p>
                  <p className="mt-2 text-sm text-gray-400 dark:text-gray-400">
                    Keep adding favorites, writing reviews, and exploring movies to unlock achievements!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {badges.map((badge) => (
                    <BadgeDisplay key={badge._id} badge={badge} />
                  ))}
                </div>
              )}

              {/* Achievement Progress */}
              {badges.length < 6 && (
                <div className="mt-8">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Work Towards More Achievements</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                      <div className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-400">Film Critic</div>
                      <p className="text-xs text-blue-600 dark:text-blue-300">Write 5+ reviews ({reviews.length}/5)</p>
                      <div className="mt-2 h-2 w-full rounded-full bg-blue-200 dark:bg-blue-800">
                        <div className="h-full rounded-full bg-blue-600" style={{width: `${Math.min(100, (reviews.length / 5) * 100)}%`}}></div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                      <div className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">Movie Enthusiast</div>
                      <p className="text-xs text-red-600 dark:text-red-300">Add 10+ to favorites ({favorites.length}/10)</p>
                      <div className="mt-2 h-2 w-full rounded-full bg-red-200 dark:bg-red-800">
                        <div className="h-full rounded-full bg-red-600" style={{width: `${Math.min(100, (favorites.length / 10) * 100)}%`}}></div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                      <div className="mb-2 text-sm font-medium text-purple-700 dark:text-purple-400">Collector</div>
                      <p className="text-xs text-purple-600 dark:text-purple-300">Add 20+ to favorites ({favorites.length}/20)</p>
                      <div className="mt-2 h-2 w-full rounded-full bg-purple-200 dark:bg-purple-800">
                        <div className="h-full rounded-full bg-purple-600" style={{width: `${Math.min(100, (favorites.length / 20) * 100)}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Reviews</h2>
                {reviews.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportReviewsAsText}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 text-sm"
                      title="Export as TXT"
                    >
                      <FaDownload /> TXT
                    </button>
                    <button
                      onClick={handleExportReviewsAsJSON}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 text-sm"
                      title="Export as JSON"
                    >
                      <FaDownload /> JSON
                    </button>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-700">
                  <p className="text-lg text-gray-500 dark:text-gray-300">
                    You haven't written any reviews yet.
                  </p>
                  <button
                    onClick={() => navigate('/search')}
                    className="mt-4 rounded-lg bg-secondary px-6 py-2 font-medium text-white hover:bg-secondary/80"
                  >
                    Discover Movies
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review._id || review.id}
                      className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 md:flex-row"
                    >
                      {review.movie?.poster_path && (
                        <div className="w-full md:w-1/4">
                          <img
                            src={getImageUrl(review.movie.poster_path)}
                            alt={review.movie.title}
                            className="h-48 w-full object-cover md:h-full"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-between p-6">
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {review.movie?.title || `Movie ${review.movieId}`}
                            </h3>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={i < Math.round((review.rating || 0) / 2) ? 'text-yellow-500' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {review.title}
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                        </div>
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                          Posted on {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                        <div className="mt-4">
                          <button
                            onClick={() => navigate(`/movie/${review.movieId}`)}
                            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/80"
                          >
                            View Movie
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;