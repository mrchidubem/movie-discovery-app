import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser, FaMapPin, FaLink, FaHeart, FaStar, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  followUser,
  unfollowUser,
  checkIsFollowing,
} from '../services/socialService';
import { getUserReviews } from '../services/userService';
import { getImageUrl } from '../services/tmdbApi';
import Loader from '../components/Loader';
import { showToast } from '../components/ToastContainer';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, reviewsData] = await Promise.all([
          getUserProfile(userId),
          getUserReviews(userId),
        ]);

        setProfile(profileData);
        setReviews(reviewsData || []);

        // Check if current user is following this user
        if (currentUser && currentUser._id !== userId) {
          const following = await checkIsFollowing(userId);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        showToast('error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        showToast('success', 'Unfollowed successfully');
      } else {
        await followUser(userId);
        setIsFollowing(true);
        showToast('success', 'Followed successfully');
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User not found</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 rounded-lg bg-secondary px-6 py-2 text-white hover:bg-secondary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === userId;

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Profile Header */}
        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-secondary to-secondary/70 sm:h-48"></div>

          {/* Profile Info */}
          <div className="px-6 py-8 sm:px-12">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <img
                  src={profile.photoURL || 'https://via.placeholder.com/150?text=User'}
                  alt={profile.displayName || profile.name}
                  className="h-32 w-32 rounded-full border-4 border-white object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=User';
                  }}
                />

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {profile.displayName || profile.name}
                  </h1>
                  {profile.bio && (
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{profile.bio}</p>
                  )}
                  <div className="mt-4 flex gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaHeart className="text-red-500" />
                      {profile.followers?.length || 0} Followers
                    </span>
                    <span className="flex items-center gap-1">
                      <FaUser />
                      {profile.following?.length || 0} Following
                    </span>
                  </div>
                </div>
              </div>

              {!isOwnProfile && currentUser && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`flex items-center gap-2 rounded-lg px-6 py-2 font-medium text-white transition-colors ${
                    isFollowing
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-secondary hover:bg-secondary/90'
                  } disabled:opacity-50`}
                >
                  {isFollowing ? (
                    <>
                      <FaUserCheck /> Following
                    </>
                  ) : (
                    <>
                      <FaUserPlus /> Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-400">This user hasn't written any reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div
                  key={review._id}
                  className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800"
                >
                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:gap-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {review.movie?.title || `Movie ${review.movieId}`}
                      </h3>

                      <div className="my-2 flex items-center gap-2">
                        <span className="text-sm font-semibold text-secondary">⭐ {review.rating}/10</span>
                      </div>

                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">{review.title}</h4>
                      <p className="mt-2 line-clamp-3 text-gray-600 dark:text-gray-300">
                        {review.comment}
                      </p>

                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
