// Simple in-memory + localStorage cache utility for API responses
class CacheManager {
  constructor(ttl = 3600) {
    this.ttl = ttl; // Default TTL: 1 hour (in seconds)
    this.memory = new Map();
  }

  // Generate cache key from URL and params
  generateKey(url, params = {}) {
    const paramStr = Object.entries(params)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${url}${paramStr ? '?' + paramStr : ''}`;
  }

  // Set cache with expiration
  set(key, data, ttl = this.ttl) {
    const expiresAt = Date.now() + ttl * 1000;
    const cacheData = { data, expiresAt };

    // Store in memory
    this.memory.set(key, cacheData);

    // Store in localStorage
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('LocalStorage quota exceeded:', error);
    }
  }

  // Get from cache (checks memory first, then localStorage)
  get(key) {
    // Check memory first
    let cached = this.memory.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        cached = JSON.parse(stored);
        if (cached.expiresAt > Date.now()) {
          // Restore to memory
          this.memory.set(key, cached);
          return cached.data;
        } else {
          // Remove expired cache
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
    }

    return null;
  }

  // Clear specific cache entry
  clear(key) {
    this.memory.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
  }

  // Clear all caches
  clearAll() {
    this.memory.clear();
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('cache_'))
        .forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error clearing all localStorage caches:', error);
    }
  }

  // Clear expired caches
  clearExpired() {
    const now = Date.now();
    for (const [key, { expiresAt }] of this.memory.entries()) {
      if (expiresAt <= now) {
        this.clear(key);
      }
    }
  }

  // Get cache size
  getSize() {
    return this.memory.size;
  }
}

export default new CacheManager();
