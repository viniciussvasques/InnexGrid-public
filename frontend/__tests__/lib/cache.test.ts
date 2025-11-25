import { getCache, setCache, clearCache, clearAllCache, getCachedOrFetch } from '@/lib/cache'

// Mock localStorage with shared store
let store: Record<string, string> = {}

// Create a proper localStorage mock that works with Object.keys()
const localStorageMock = Object.create(null, {
  getItem: {
    value: jest.fn((key: string) => store[key] || null),
    writable: true,
    configurable: true,
  },
  setItem: {
    value: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    writable: true,
    configurable: true,
  },
  removeItem: {
    value: jest.fn((key: string) => {
      delete store[key]
    }),
    writable: true,
    configurable: true,
  },
  clear: {
    value: jest.fn(() => {
      store = {}
    }),
    writable: true,
    configurable: true,
  },
  length: {
    get: () => Object.keys(store).length,
    configurable: true,
  },
  key: {
    value: jest.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    writable: true,
    configurable: true,
  },
})

// Make store keys enumerable for Object.keys() to work
Object.defineProperty(window, 'localStorage', {
  value: new Proxy(localStorageMock, {
    ownKeys: () => Object.keys(store),
    getOwnPropertyDescriptor: (target, prop) => {
      if (store.hasOwnProperty(prop)) {
        return {
          enumerable: true,
          configurable: true,
          value: store[prop as string],
        }
      }
      return undefined
    },
    get: (target, prop) => {
      if (prop === 'getItem') return localStorageMock.getItem
      if (prop === 'setItem') return localStorageMock.setItem
      if (prop === 'removeItem') return localStorageMock.removeItem
      if (prop === 'clear') return localStorageMock.clear
      if (prop === 'length') return Object.keys(store).length
      if (prop === 'key') return localStorageMock.key
      if (store.hasOwnProperty(prop as string)) {
        return store[prop as string]
      }
      return undefined
    },
    set: (target, prop, value) => {
      if (typeof prop === 'string') {
        store[prop] = value
      }
      return true
    },
    deleteProperty: (target, prop) => {
      if (typeof prop === 'string' && store.hasOwnProperty(prop)) {
        delete store[prop]
        return true
      }
      return false
    },
  }),
  writable: true,
  configurable: true,
})

describe('Cache Utility', () => {
  beforeEach(() => {
    store = {}
    jest.clearAllMocks()
  })

  describe('setCache and getCache', () => {
    it('should store and retrieve data', () => {
      const testData = { name: 'test', value: 123 }
      setCache('test-key', testData, 60000)
      
      const retrieved = getCache('test-key')
      expect(retrieved).toEqual(testData)
    })

    it('should return null for non-existent key', () => {
      const retrieved = getCache('non-existent')
      expect(retrieved).toBeNull()
    })

    it('should return null for expired cache', async () => {
      const testData = { name: 'test' }
      setCache('expired-key', testData, 100) // 100ms TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const retrieved = getCache('expired-key')
      expect(retrieved).toBeNull()
    })
  })

  describe('clearCache', () => {
    it('should remove cache entry', () => {
      setCache('test-key', { data: 'test' })
      expect(getCache('test-key')).not.toBeNull()
      
      clearCache('test-key')
      expect(getCache('test-key')).toBeNull()
    })
  })

  describe('clearAllCache', () => {
    it('should remove all cache entries', () => {
      setCache('key1', { data: 'test1' })
      setCache('key2', { data: 'test2' })
      
      // Verify they exist
      expect(getCache('key1')).not.toBeNull()
      expect(getCache('key2')).not.toBeNull()
      
      // Clear all cache
      clearAllCache()
      
      // Verify all cache keys are removed
      expect(getCache('key1')).toBeNull()
      expect(getCache('key2')).toBeNull()
      
      // Verify store is empty of cache keys
      const cacheKeys = Object.keys(store).filter((k: string) => k.startsWith('innexgrid_cache_'))
      expect(cacheKeys.length).toBe(0)
    })
  })

  describe('getCachedOrFetch', () => {
    it('should return cached data if available', async () => {
      const testData = { name: 'cached' }
      setCache('fetch-key', testData)
      
      const fetchFn = jest.fn().mockResolvedValue({ name: 'fetched' })
      const result = await getCachedOrFetch('fetch-key', fetchFn)
      
      expect(result).toEqual(testData)
      expect(fetchFn).not.toHaveBeenCalled()
    })

    it('should fetch and cache if not cached', async () => {
      const fetchData = { name: 'fetched' }
      const fetchFn = jest.fn().mockResolvedValue(fetchData)
      
      const result = await getCachedOrFetch('new-key', fetchFn)
      
      expect(result).toEqual(fetchData)
      expect(fetchFn).toHaveBeenCalledTimes(1)
      
      // Verify it's cached
      const cached = getCache('new-key')
      expect(cached).toEqual(fetchData)
    })
  })
})

