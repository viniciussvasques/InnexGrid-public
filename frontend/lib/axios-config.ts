/**
 * Axios configuration with retry interceptor
 */
import axios from 'axios'
import { createRetryInterceptor } from './api-retry'

// Create axios instance
export const apiClient = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add retry interceptor
createRetryInterceptor(apiClient, {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: (attempt, error) => {
    console.log(`Retrying API call (attempt ${attempt}):`, error.config?.url)
  },
})

// Request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('innexgrid_auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('innexgrid_auth_token')
        localStorage.removeItem('innexgrid_auth_address')
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

