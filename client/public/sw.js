const CACHE_NAME = 'movie-discovery-v1';
const API_CACHE = 'movie-api-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/public/manifest.json',
  '/src/index.css',
];

const API_ENDPOINTS_TO_CACHE = [
  '/api/trending',
  '/api/genres',
  '/api/popular',
  '/api/now-playing',
  '/api/upcoming',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => asset !== '/'));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests differently
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      caches.open(API_CACHE)
        .then((cache) => {
          return fetch(request)
            .then((response) => {
              // Cache successful API responses
              if (response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Fallback to cached version if offline
              return cache.match(request)
                .then((cached) => {
                  if (cached) {
                    console.log('[ServiceWorker] Serving from API cache:', request.url);
                    return cached;
                  }
                  return new Response('Offline - Data not available', {
                    status: 503,
                    statusText: 'Service Unavailable',
                  });
                });
            });
        })
    );
  } else {
    // Handle static assets
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            console.log('[ServiceWorker] Serving from cache:', request.url);
            return cached;
          }
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response.status === 200 && request.destination === 'document') {
                const cache = caches.open(CACHE_NAME);
                cache.then((c) => c.put(request, response.clone()));
              }
              return response;
            })
            .catch(() => {
              if (request.destination === 'document') {
                return caches.match('/index.html');
              }
              return new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
              });
            });
        })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

async function syncFavorites() {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingFavorites', 'readonly');
    const store = tx.objectStore('pendingFavorites');
    const items = await store.getAll();

    for (const item of items) {
      await fetch('/api/favorites', {
        method: 'POST',
        body: JSON.stringify(item),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clear pending if successful
    const writeTx = db.transaction('pendingFavorites', 'readwrite');
    await writeTx.objectStore('pendingFavorites').clear();
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push event received');
  
  const data = event.data ? event.data.json() : {
    title: 'Movie Discovery App',
    body: 'You have a new notification',
  };

  const options = {
    body: data.body,
    icon: data.icon || '/logo-192.png',
    badge: data.badge || '/badge.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windows) => {
        // Check if app is already open
        const url = event.notification.data?.url || '/';
        for (let i = 0; i < windows.length; i++) {
          if (windows[i].url === url && 'focus' in windows[i]) {
            return windows[i].focus();
          }
        }
        // Open new window if not found
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MovieDiscoveryDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pendingFavorites')) {
        db.createObjectStore('pendingFavorites', { keyPath: 'id' });
      }
    };
  });
}
