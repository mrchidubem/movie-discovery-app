import { useState, useEffect } from 'react';
import { FaStar, FaFilm, FaClock, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import api from '../services/api';

const UserAnalyticsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch analytics from backend
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/analytics/dashboard');
        setAnalytics(res.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <div className="text-center py-12">Please log in to view your analytics</div>;
  }

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">📊 Your Movie Statistics</h1>

      {/* Stats Grid */}
      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-blue-100 p-6 dark:bg-blue-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Movies Watched</p>
              <p className="text-3xl font-bold text-blue-600">{analytics?.moviesWatched || 0}</p>
            </div>
            <FaFilm className="text-5xl text-blue-200" />
          </div>
        </div>

        <div className="rounded-lg bg-green-100 p-6 dark:bg-green-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hours Watched</p>
              <p className="text-3xl font-bold text-green-600">{Math.round(analytics?.totalHoursWatched || 0)}</p>
            </div>
            <FaClock className="text-5xl text-green-200" />
          </div>
        </div>

        <div className="rounded-lg bg-orange-100 p-6 dark:bg-orange-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
              <p className="text-3xl font-bold text-orange-600">{analytics?.averageRating || 0}</p>
            </div>
            <FaStar className="text-5xl text-orange-200" />
          </div>
        </div>

        <div className="rounded-lg bg-purple-100 p-6 dark:bg-purple-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Year</p>
              <p className="text-3xl font-bold text-purple-600">{selectedYear}</p>
            </div>
            <FaChartBar className="text-5xl text-purple-200" />
          </div>
        </div>
      </div>

      {/* Top Rated Movies */}
      <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold">Your Top Rated Movies</h2>
        <div className="space-y-3">
          {analytics?.topRatedMovies?.map((movie, idx) => (
            <div key={idx} className="flex items-center justify-between rounded bg-white p-3 dark:bg-gray-700">
              <span className="font-medium">{movie.title}</span>
              <span className="text-lg font-bold text-secondary">⭐ {movie.rating}/5</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsPage;
