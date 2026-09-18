/**
 * High-performance client-side in-memory cache for AriRent API requests.
 * Provides instant (0ms) page navigation and eliminates redundant network round-trips.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Default cache duration: 2 minutes
const DEFAULT_TTL_MS = 120_000;

export const clientCache = {
  /**
   * Retrieve cached data if present and not expired.
   */
  get<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }

    return entry.data as T;
  },

  /**
   * Store data in cache with a TTL (defaults to 2 minutes).
   */
  set<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
    store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  },

  /**
   * Execute fetcher only if key is not already cached; otherwise return cached data immediately.
   */
  async remember<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = DEFAULT_TTL_MS
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    this.set(key, fresh, ttlMs);
    return fresh;
  },

  /**
   * Invalidate all cache entries matching a prefix or pattern.
   * e.g. invalidate("properties") will clear all property and room caches.
   */
  invalidate(prefix: string): void {
    const normalizedPrefix = prefix.toLowerCase();
    for (const key of store.keys()) {
      if (key.toLowerCase().startsWith(normalizedPrefix)) {
        store.delete(key);
      }
    }
  },

  /**
   * Clear entire cache (useful on logout or hard refresh).
   */
  clear(): void {
    store.clear();
  },
};
