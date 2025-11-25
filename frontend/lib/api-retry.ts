/**
 * Retry utility for API calls with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableStatuses?: number[]
  onRetry?: (attempt: number, error: any) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, retryableStatuses: number[]): boolean {
  // Network errors
  if (!error.response) {
    return true
  }
  
  // HTTP status codes
  const status = error.response?.status
  return status ? retryableStatuses.includes(status) : false
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
  return Math.min(delay, maxDelay)
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break
      }

      // Check if error is retryable
      if (!isRetryableError(error, opts.retryableStatuses)) {
        throw error
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      )

      // Call onRetry callback
      opts.onRetry(attempt + 1, error)

      // Wait before retrying
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Create an axios interceptor for automatic retry
 */
export function createRetryInterceptor(axios: any, options: RetryOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  axios.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const config = error.config

      // Don't retry if retry flag is set to false
      if (config?.retry === false) {
        return Promise.reject(error)
      }

      // Initialize retry count
      config.__retryCount = config.__retryCount || 0

      // Check if we should retry
      if (config.__retryCount >= opts.maxRetries) {
        return Promise.reject(error)
      }

      if (!isRetryableError(error, opts.retryableStatuses)) {
        return Promise.reject(error)
      }

      // Increment retry count
      config.__retryCount += 1

      // Calculate delay
      const delay = calculateDelay(
        config.__retryCount - 1,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      )

      // Call onRetry callback
      opts.onRetry?.(config.__retryCount, error)

      // Wait before retrying
      await sleep(delay)

      // Retry the request
      return axios(config)
    }
  )
}

