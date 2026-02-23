import { useState, useEffect } from 'react';
import { FaFilter, FaSort, FaStar } from 'react-icons/fa';
import MovieGrid from '../components/MovieGrid';
import Loader from '../components/Loader';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES } from '../utils/countries';
import { getGenres } from '../services/tmdbApi';

const AdvancedFilterPage = () => {
  const [filters, setFilters] = useState({
    minRating: 0,
    maxRating: 10,
    fromYear: 1900,
    toYear: new Date().getFullYear(),
    minRuntime: 0,
    maxRuntime: 300,
    language: 'en',
    genres: [],
    sortBy: 'popularity.desc',
    country: '',
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    (async () => {
      try {
        const g = await getGenres();
        setAvailableGenres(g || []);
      } catch (err) {
        console.error('Failed to load genres', err);
      }
    })();
  }, []);

  const { isAuthenticated } = useAuth();

  const handleApplyFilters = () => {
    if (!isAuthenticated) {
      setResults([]);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    (async (pageToLoad = 1) => {
      try {
        setErrorMessage('');
        const params = {
          page: pageToLoad,
          minRating: filters.minRating || undefined,
          maxRating: filters.maxRating || undefined,
          fromYear: filters.fromYear || undefined,
          toYear: filters.toYear || undefined,
          minRuntime: filters.minRuntime || undefined,
          maxRuntime: filters.maxRuntime || undefined,
          language: filters.language || undefined,
          sortBy: filters.sortBy || undefined,
        };

        if (filters.country) params.country = filters.country;
        if (filters.category) params.category = filters.category;

        const response = await api.get('/api/search/advanced', { params });
        const data = response.data || {};
        setResults(data.results || []);
        setTotalPages(data.total_pages || 0);
        setPage(data.page || 1);
      } catch (err) {
        console.error('Advanced search failed', err);
        setErrorMessage(err?.response?.data?.error || err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    })(1);
  };

  const handlePageChange = async (newPage) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params = {
        page: newPage,
        minRating: filters.minRating || undefined,
        maxRating: filters.maxRating || undefined,
        fromYear: filters.fromYear || undefined,
        toYear: filters.toYear || undefined,
        minRuntime: filters.minRuntime || undefined,
        maxRuntime: filters.maxRuntime || undefined,
        language: filters.language || undefined,
        sortBy: filters.sortBy || undefined,
      };
      if (filters.country) params.country = filters.country;
      if (filters.category) params.category = filters.category;

      const response = await api.get('/api/search/advanced', { params });
      const data = response.data || {};
      setResults(data.results || []);
      setTotalPages(data.total_pages || 0);
      setPage(data.page || newPage);
    } catch (err) {
      console.error('Advanced search failed', err);
      setErrorMessage(err?.response?.data?.error || err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">🔍 Advanced Search</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filter Sidebar */}
        <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-800 lg:col-span-1">
          <h2 className="mb-4 flex items-center text-xl font-bold">
            <FaFilter className="mr-2" /> Filters
          </h2>

          <div className="space-y-4">
            {/* Country selector */}
            <div>
              <label className="block text-sm font-semibold">Country</label>
              <select value={filters.country} onChange={(e) => handleFilterChange('country', e.target.value)} className="w-full rounded border px-2 py-1 dark:bg-gray-700">
                <option value="">Any</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Category / Genre selector */}
            <div>
              <label className="block text-sm font-semibold">Category</label>
              <select value={filters.category || ''} onChange={(e) => handleFilterChange('category', e.target.value)} className="w-full rounded border px-2 py-1 dark:bg-gray-700">
                <option value="">Any</option>
                {availableGenres.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold">Rating: {filters.minRating} - {filters.maxRating}</label>
              <input type="range" min="0" max="10" value={filters.minRating} 
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                className="w-full" />
              <input type="range" min="0" max="10" value={filters.maxRating}
                onChange={(e) => handleFilterChange('maxRating', e.target.value)}
                className="w-full" />
            </div>

            {/* Year Range */}
            <div>
              <label className="block text-sm font-semibold">Year: {filters.fromYear} - {filters.toYear}</label>
              <input type="number" value={filters.fromYear} 
                onChange={(e) => handleFilterChange('fromYear', e.target.value)}
                className="w-full rounded border px-2 py-1 dark:bg-gray-700" min="1900" max={new Date().getFullYear()} />
              <input type="number" value={filters.toYear}
                onChange={(e) => handleFilterChange('toYear', e.target.value)}
                className="mt-2 w-full rounded border px-2 py-1 dark:bg-gray-700" min="1900" max={new Date().getFullYear()} />
            </div>

            {/* Runtime */}
            <div>
              <label className="block text-sm font-semibold">Runtime: {filters.minRuntime}min - {filters.maxRuntime}min</label>
              <input type="range" min="0" max="300" value={filters.minRuntime}
                onChange={(e) => handleFilterChange('minRuntime', e.target.value)}
                className="w-full" />
              <input type="range" min="0" max="300" value={filters.maxRuntime}
                onChange={(e) => handleFilterChange('maxRuntime', e.target.value)}
                className="w-full" />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold">Sort By</label>
              <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full rounded border px-2 py-1 dark:bg-gray-700">
                <option value="popularity.desc">Most Popular</option>
                <option value="vote_average.desc">Highest Rated</option>
                <option value="release_date.desc">Newest First</option>
              </select>
            </div>

            <button onClick={handleApplyFilters}
              className="w-full rounded bg-secondary px-4 py-2 font-medium text-white hover:bg-secondary/90">
              {isAuthenticated ? 'Apply Filters' : 'Log in to Search'}
            </button>
            {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {loading ? (
            <Loader />
          ) : (
            <MovieGrid
              movies={results}
              title={`Advanced Results (${results.length})`}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilterPage;
