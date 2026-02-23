// In-memory cache middleware for frequent API calls
const cache = new Map();

// Cache configuration by endpoint
const CACHE_CONFIG = {
  '/api/trending': { ttl: 300 }, // 5 minutes
  '/api/genres': { ttl: 86400 }, // 24 hours
  '/api/popular': { ttl: 600 }, // 10 minutes
  '/api/now-playing': { ttl: 600 }, // 10 minutes
  '/api/upcoming': { ttl: 3600 }, // 1 hour
  '/api/watch-providers': { ttl: 86400 }, // 24 hours
  '/api/search': { ttl: 300 }, // 5 minutes - cache advanced/search queries (keyed by query params)
};

// Generate cache key from request
const generateCacheKey = (req) => {
  // Use path + sorted query params to produce a stable key (avoid duplicated query strings)
  const path = req.path || req.originalUrl || '';
  const query = Object.entries(req.query || {})
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return `${path}${query ? '?' + query : ''}`;
};

// Cache middleware
const cacheMiddleware = (ttl) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = generateCacheKey(req);
  const cachedData = cache.get(cacheKey);

  if (cachedData && cachedData.expiresAt > Date.now()) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return res.json(cachedData.data);
  }

  // Remove expired cache
  if (cachedData) {
    cache.delete(cacheKey);
  }

  // Override res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    const expiresAt = Date.now() + (ttl || 300) * 1000;
    cache.set(cacheKey, { data, expiresAt });
    console.log(`💾 Cached: ${cacheKey} (TTL: ${ttl}s)`);
    return originalJson(data);
  };

  next();
};

// Middleware to apply appropriate cache based on endpoint
const smartCache = (req, res, next) => {
  for (const [endpoint, config] of Object.entries(CACHE_CONFIG)) {
    if (req.path.includes(endpoint)) {
      return cacheMiddleware(config.ttl)(req, res, next);
    }
  }
  next();
};

// Clear cache utility
const clearCache = (pattern = null) => {
  if (!pattern) {
    cache.clear();
    console.log('🗑️  All cache cleared');
  } else {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
    console.log(`🗑️  Cache cleared for: ${pattern}`);
  }
};

// Get cache stats
const getCacheStats = () => {
  let totalSize = 0;
  for (const { data } of cache.values()) {
    totalSize += JSON.stringify(data).length;
  }
  return {
    entries: cache.size,
    sizeBytes: totalSize,
    sizeKB: (totalSize / 1024).toFixed(2),
  };
};

module.exports = {
  cacheMiddleware,
  smartCache,
  clearCache,
  getCacheStats,
};
