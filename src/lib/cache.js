// Simple in-memory cache with TTL support
class Cache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 5 * 60 * 1000) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Create cache instances for different data types
export const productCache = new Cache();
export const categoryCache = new Cache();
export const userCache = new Cache();
export const orderCache = new Cache();

// Clean up caches periodically
setInterval(() => {
  productCache.cleanup();
  categoryCache.cleanup();
  userCache.cleanup();
  orderCache.cleanup();
}, 60 * 1000); // Every minute

// React Query cache utilities
export const getQueryCacheKey = (type, id) => {
  return [type, id];
};

export const invalidateCache = (type, id) => {
  const cacheMap = {
    products: productCache,
    categories: categoryCache,
    users: userCache,
    orders: orderCache,
  };
  
  const cache = cacheMap[type];
  if (cache && id) {
    cache.delete(`${type}:${id}`);
  } else if (cache) {
    cache.clear();
  }
};
