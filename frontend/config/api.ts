const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    providers: {
      register: `${API_BASE_URL}/api/providers/register`,
      get: (address: string) => `${API_BASE_URL}/api/providers/${address}`,
      list: `${API_BASE_URL}/api/providers`,
      updateCapacity: (address: string) => `${API_BASE_URL}/api/providers/${address}/capacity`,
      rewards: (address: string) => `${API_BASE_URL}/api/providers/${address}/rewards`,
      distributeReward: (address: string) => `${API_BASE_URL}/api/providers/${address}/distribute-reward`,
      reservations: (address: string) => `${API_BASE_URL}/api/providers/${address}/reservations`,
      update: (address: string) => `${API_BASE_URL}/api/providers/${address}`,
      toggleStatus: (address: string) => `${API_BASE_URL}/api/providers/${address}/toggle-status`,
    },
    consumers: {
      register: `${API_BASE_URL}/api/consumers/register`,
      get: (address: string) => `${API_BASE_URL}/api/consumers/${address}`,
      list: `${API_BASE_URL}/api/consumers`,
      history: (address: string) => `${API_BASE_URL}/api/consumers/${address}/history`,
      reservations: (address: string) => `${API_BASE_URL}/api/consumers/${address}/reservations`,
    },
    marketplace: {
      list: `${API_BASE_URL}/api/marketplace`,
      search: `${API_BASE_URL}/api/marketplace/search`,
      reserve: `${API_BASE_URL}/api/marketplace/reserve`,
      cancelReservation: (id: string) => `${API_BASE_URL}/api/marketplace/cancel-reservation/${id}`,
      getReservation: (id: string) => `${API_BASE_URL}/api/marketplace/reservation/${id}`,
      completeReservation: (id: string) => `${API_BASE_URL}/api/marketplace/complete-reservation/${id}`,
    },
    ratings: {
      create: `${API_BASE_URL}/api/ratings`,
      getByProvider: (address: string) => `${API_BASE_URL}/api/ratings/provider/${address}`,
    },
    usage: {
      record: `${API_BASE_URL}/api/usage/record`,
      history: (address: string) => `${API_BASE_URL}/api/consumers/${address}/history`,
      providerHistory: (address: string) => `${API_BASE_URL}/api/usage/provider/${address}`,
    },
    payments: {
      process: `${API_BASE_URL}/api/payments/process`,
      history: `${API_BASE_URL}/api/payments/history`,
    },
    auth: {
      login: `${API_BASE_URL}/api/auth/login`,
      verify: `${API_BASE_URL}/api/auth/verify`,
    },
    monitoring: {
      stats: `${API_BASE_URL}/api/monitoring/stats`,
    },
  },
}
