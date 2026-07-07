/**
 * Cache Service - In-memory caching with optional Redis fallback
 *
 * Features:
 *   - In-memory LRU cache (default)
 *   - Configurable TTL per cache entry
 *   - Automatic cache invalidation on updates
 *   - Redis support (when REDIS_URL is set)
 *
 * Usage:
 *   import cache from './utils/cacheService.js';
 *
 *   // Set with TTL (default 60 seconds)
 *   await cache.set('key', data, 120); // 2 minutes
 *
 *   // Get
 *   const value = await cache.get('key');
 *
 *   // Delete
 *   await cache.delete('key');
 *
 *   // Clear all
 *   await cache.clear();
 */

// ── Configuration ─────────────────────────────────────────────────────────────

const CACHE_TTL_DEFAULT = 60; // 60 seconds
const CACHE_MAX_SIZE = 1000; // Max entries in memory

// ── In-memory cache (LRU-like) ───────────────────────────────────────────────

class MemoryCache {
  constructor(maxSize = CACHE_MAX_SIZE) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key, value, ttlSeconds = CACHE_TTL_DEFAULT) {
    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return true;
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    return true;
  }

  /**
   * Get cache stats
   */
  getStats() {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// ── Redis cache (optional) ───────────────────────────────────────────────────

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (!process.env.REDIS_URL) return false;

    try {
      const redis = await import('redis');
      this.client = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) return false; // Max 10 reconnects
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      await this.client.connect();
      return true;
    } catch (error) {
      console.warn('Redis connection failed, using in-memory cache only');
      return false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = CACHE_TTL_DEFAULT) {
    if (!this.isConnected || !this.client) return false;
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async delete(key) {
    if (!this.isConnected || !this.client) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  async clear() {
    if (!this.isConnected || !this.client) return false;
    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis CLEAR error:', error);
      return false;
    }
  }

  getStats() {
    return {
      type: 'redis',
      connected: this.isConnected,
    };
  }
}

// ── Unified cache service ────────────────────────────────────────────────────

class CacheService {
  constructor() {
    this.memoryCache = new MemoryCache(CACHE_MAX_SIZE);
    this.redisCache = new RedisCache();
    this.enabled = true;
  }

  async connect() {
    // Try Redis first, fall back to memory
    if (process.env.REDIS_URL) {
      const redisConnected = await this.redisCache.connect();
      if (redisConnected) {
        console.log('Cache service using Redis');
        return true;
      }
    }
    console.log('Cache service using in-memory');
    return true;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.enabled) return null;

    // Try Redis first
    if (this.redisCache.isConnected) {
      const value = await this.redisCache.get(key);
      if (value !== null) return value;
    }

    // Fall back to memory
    return this.memoryCache.get(key);
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key, value, ttlSeconds = CACHE_TTL_DEFAULT) {
    if (!this.enabled) return true;

    // Try Redis first
    if (this.redisCache.isConnected) {
      return await this.redisCache.set(key, value, ttlSeconds);
    }

    // Fall back to memory
    return this.memoryCache.set(key, value, ttlSeconds);
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    let result = true;

    // Try Redis first
    if (this.redisCache.isConnected) {
      result = await this.redisCache.delete(key);
    }

    // Always delete from memory too
    this.memoryCache.delete(key);

    return result;
  }

  /**
   * Clear all cache entries
   */
  async clear() {
    let result = true;

    // Try Redis first
    if (this.redisCache.isConnected) {
      result = await this.redisCache.clear();
    }

    // Always clear memory too
    this.memoryCache.clear();

    return result;
  }

  /**
   * Get cache stats
   */
  getStats() {
    if (this.redisCache.isConnected) {
      return this.redisCache.getStats();
    }
    return this.memoryCache.getStats();
  }

  /**
   * Enable/disable caching
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// ── Singleton instance ───────────────────────────────────────────────────────

const cache = new CacheService();

export default cache;
export { MemoryCache, RedisCache, CacheService };
