import { useState } from 'react';
import { FaCalendar, FaTv } from 'react-icons/fa';

const StreamingCalendarPage = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const platforms = ['Netflix', 'ShowMax', 'Amazon Prime', 'Disney+', 'HBO Max', 'Hulu'];

  const streamingUpdates = [
    {
      date: '2026-02-25',
      type: 'arriving',
      platform: 'Netflix',
      movies: ['The Matrix', 'Inception', 'Dune'],
    },
    {
      date: '2026-02-26',
      type: 'arriving',
      platform: 'Amazon Prime',
      movies: ['Interstellar', 'The Martian'],
    },
    {
      date: '2026-02-28',
      type: 'leaving',
      platform: 'ShowMax',
      movies: ['Avatar', 'Avatar 2'],
    },
    {
      date: '2026-03-01',
      type: 'arriving',
      platform: 'Disney+',
      movies: ['Thor: Ragnarok', 'Black Panther'],
    },
    {
      date: '2026-03-03',
      type: 'leaving',
      platform: 'Netflix',
      movies: ['Breaking Bad', 'Stranger Things'],
    },
    {
      date: '2026-03-05',
      type: 'arriving',
      platform: 'HBO Max',
      movies: ['Oppenheimer', 'Barbie'],
    },
    {
      date: '2026-03-07',
      type: 'arriving',
      platform: 'Hulu',
      movies: ['Only Murders in the Building', 'The Bear'],
    },
    {
      date: '2026-03-10',
      type: 'leaving',
      platform: 'Amazon Prime',
      movies: ['The Lord of the Rings', 'Hobbit'],
    },
  ];

  // Filter updates based on selected platform
  const filteredUpdates = selectedPlatform === 'all'
    ? streamingUpdates
    : streamingUpdates.filter(update => update.platform.toLowerCase() === selectedPlatform.toLowerCase());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">📅 Streaming Calendar</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Track when your favorite movies arrive and leave streaming platforms
      </p>

      {/* Platform Filter */}
      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`rounded-full px-4 py-2 font-medium transition-all ${
            selectedPlatform === 'all'
              ? 'bg-secondary text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All Platforms ({streamingUpdates.length})
        </button>
        {platforms.map(platform => {
          const count = streamingUpdates.filter(u => u.platform === platform).length;
          return (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`rounded-full px-4 py-2 font-medium transition-all ${
                selectedPlatform.toLowerCase() === platform.toLowerCase()
                  ? 'bg-secondary text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {platform} ({count})
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {filteredUpdates.length > 0 ? (
          filteredUpdates
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((update, idx) => (
          <div key={idx} className="rounded-lg border-l-4 border-secondary bg-white p-6 dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <FaCalendar className="text-secondary" />
                  <span className="font-semibold text-lg">{new Date(update.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <FaTv className="text-blue-500" />
                  <span className="font-medium text-base">{update.platform}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    update.type === 'arriving'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {update.type === 'arriving' ? '✨ Coming Soon' : '👋 Leaving Soon'}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {update.movies.map((movie, i) => (
                    <div key={i} className="rounded bg-gray-100 px-3 py-2 text-sm dark:bg-gray-700 flex items-center gap-2">
                      <span>🎬</span>
                      <span>{movie}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800">
            <FaCalendar className="mx-auto mb-4 text-4xl text-gray-400" />
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No updates for {selectedPlatform === 'all' ? 'any platform' : `${selectedPlatform}`}
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              Check back soon for new releases and departures
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-900/20">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          🔔 Enable notifications to get alerts when your favorite movies arrive on streaming services
        </p>
        <button className="rounded-lg bg-secondary px-6 py-2 font-medium text-white hover:bg-secondary/90 transition-colors">
          Enable Notifications
        </button>
      </div>
    </div>
  );
};

export default StreamingCalendarPage;
