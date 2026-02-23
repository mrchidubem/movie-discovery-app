import { useState } from 'react';
import { FaAward, FaThumbsUp, FaHeart } from 'react-icons/fa';
import { discoverMovies } from '../services/tmdbApi';
import MovieGrid from '../components/MovieGrid';
import Loader from '../components/Loader';

const CuratedCollectionsPage = () => {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [query, setQuery] = useState('');
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [collectionMovies, setCollectionMovies] = useState([]);

  // Curated definitions backed by TMDB discover filters for higher accuracy
  const collections = [
    {
      id: 1,
      title: '🏆 Best Movies of 2024',
      description: 'Critically acclaimed, high-rated releases from 2024',
      image: '🎬',
      fetchFn: () =>
        discoverMovies(
          {
            'primary_release_date.gte': '2024-01-01',
            'primary_release_date.lte': '2024-12-31',
            'vote_average.gte': 7,
            'vote_count.gte': 500,
            sort_by: 'vote_average.desc',
          },
          1,
        ),
    },
    {
      id: 2,
      title: '💎 Hidden Gems',
      description: 'Highly rated but less-discovered movies',
      image: '✨',
      fetchFn: () =>
        discoverMovies(
          {
            'vote_average.gte': 7.5,
            'vote_count.gte': 50,
            'vote_count.lte': 1500,
            sort_by: 'vote_average.desc',
          },
          1,
        ),
    },
    {
      id: 3,
      title: '🎖️ Award-Caliber Dramas',
      description: 'Prestige dramas with exceptional scores',
      image: '🏅',
      fetchFn: () =>
        discoverMovies(
          {
            with_genres: '18', // Drama
            'vote_average.gte': 7.8,
            'vote_count.gte': 1000,
            sort_by: 'vote_average.desc',
          },
          1,
        ),
    },
    {
      id: 4,
      title: '🌟 Breakout Hits',
      description: 'Recent crowd-pleasers everyone is talking about',
      image: '⭐',
      fetchFn: () =>
        discoverMovies(
          {
            'primary_release_date.gte': '2023-01-01',
            'vote_average.gte': 7,
            'vote_count.gte': 2000,
            sort_by: 'popularity.desc',
          },
          1,
        ),
    },
    {
      id: 5,
      title: '❤️ Feel-Good Movies',
      description: 'Comfort-watch comedies, romances, and family films',
      image: '😊',
      fetchFn: () =>
        discoverMovies(
          {
            with_genres: '35,10749,10751', // Comedy, Romance, Family
            'vote_average.gte': 7,
            sort_by: 'popularity.desc',
          },
          1,
        ),
    },
    {
      id: 6,
      title: '🎭 Masterpieces of Cinema',
      description: 'Timeless classics with outstanding ratings',
      image: '🎪',
      fetchFn: () =>
        discoverMovies(
          {
            'primary_release_date.lte': '2005-12-31',
            'vote_average.gte': 8.2,
            'vote_count.gte': 2000,
            sort_by: 'vote_average.desc',
          },
          1,
        ),
    },
  ];

  const openCollection = async (collection) => {
    setSelectedCollection(collection);
    setLoadingMovies(true);
    try {
      const data = await collection.fetchFn();
      setCollectionMovies(data?.results || []);
    } catch (err) {
      console.error('Failed to load collection movies', err);
      setCollectionMovies([]);
    } finally {
      setLoadingMovies(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">📚 Curated Collections</h1>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
          Hand-picked collections powered by live TMDB data. Each collection uses different filters
          (year, rating, votes, genres) to stay as accurate as possible.
        </p>
        <input
          type="search"
          placeholder="Search collections..."
          className="w-full max-w-md rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary dark:border-gray-700 dark:bg-gray-900"
          onChange={(e) => setQuery(e.target.value)}
          value={query}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {collections.map(collection => (
          query && !`${collection.title} ${collection.description}`.toLowerCase().includes(query.toLowerCase()) ? null : (
          <div
            key={collection.id}
            onClick={() => openCollection(collection)}
            className="group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 p-6 shadow-lg transition-all hover:shadow-2xl dark:from-gray-800 dark:to-gray-900"
          >
            <div className="text-5xl mb-3">{collection.image}</div>
            <h3 className="mb-2 text-xl font-bold group-hover:text-secondary">{collection.title}</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{collection.description}</p>
            <div className="flex items-center justify-between">
              <span className="inline-block rounded-full bg-secondary/20 px-3 py-1 text-sm font-semibold text-secondary">
                {collection.count} movies
              </span>
              <span className="text-secondary group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
          )
        ))}
      </div>

      {/* Collection Detail Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-2 text-2xl font-bold">{selectedCollection.title}</h2>
                <p className="text-gray-600 dark:text-gray-400">{selectedCollection.description}</p>
                <p className="mt-2 inline-block rounded-full bg-secondary/20 px-3 py-1 text-sm font-semibold text-secondary">
                  Powered by live TMDB discover filters
                </p>
              </div>
              <div className="ml-4">
                <button onClick={() => setSelectedCollection(null)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Close</button>
              </div>
            </div>

            <div>
              {loadingMovies ? (
                <Loader />
              ) : (
                <MovieGrid movies={collectionMovies} title={selectedCollection.title} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuratedCollectionsPage;
