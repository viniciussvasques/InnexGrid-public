/**
 * Cache utility for API responses
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  key?: string
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cache key
 */
function getCacheKey(key: string): string {
  return `innexgrid_cache_${key}`
}

/**
 * Get cached data
 */
export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(getCacheKey(key))
    if (!cached) return null

    const entry: CacheEntry<T> = JSON.parse(cached)

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(getCacheKey(key))
      return null
    }

    return entry.data
  } catch (error) {
    console.error('Error reading cache:', error)
    return null
  }
}

/**
 * Set cache data
 */
export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  if (typeof window === 'undefined') return

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    }

    localStorage.setItem(getCacheKey(key), JSON.stringify(entry))
  } catch (error) {
    console.error('Error writing cache:', error)
    // If storage is full, try to clear old entries
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearExpiredCache()
      try {
        const retryEntry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        }
        localStorage.setItem(getCacheKey(key), JSON.stringify(retryEntry))
      } catch (retryError) {
        console.error('Failed to write cache after cleanup:', retryError)
      }
    }
  }
}

/**
 * Clear cache entry
 */
export function clearCache(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(getCacheKey(key))
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return

  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('innexgrid_cache_')) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  if (typeof window === 'undefined') return

  const keys = Object.keys(localStorage)
  const now = Date.now()

  keys.forEach(key => {
    if (key.startsWith('innexgrid_cache_')) {
      try {
        const cached = localStorage.getItem(key)
        if (cached) {
          const entry: CacheEntry<any> = JSON.parse(cached)
          if (now > entry.expiresAt) {
            localStorage.removeItem(key)
          }
        }
      } catch (error) {
        // Remove invalid entries
        localStorage.removeItem(key)
      }
    }
  })
}

/**
 * Get cache with fallback to API call
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const ttl = options.ttl || DEFAULT_TTL

  // Try to get from cache
  const cached = getCache<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch from API
  const data = await fetchFn()

  // Cache the result
  setCache(key, data, ttl)

  return data
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCachePattern(pattern: string): void {
  if (typeof window === 'undefined') return

  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('innexgrid_cache_') && key.includes(pattern)) {
      localStorage.removeItem(key)
    }
  })
}

