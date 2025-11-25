import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { apiConfig } from '@/config/api'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })

  // Carregar token do localStorage ao montar (apenas no cliente)
  useEffect(() => {
    if (globalThis.window === undefined) return

    const storedToken = localStorage.getItem('innexgrid_auth_token')
    const storedAddress = localStorage.getItem('innexgrid_auth_address')
    
    if (storedToken && storedAddress && address?.toLowerCase() === storedAddress.toLowerCase()) {
      setAuthState(prev => ({
        ...prev,
        token: storedToken,
        isAuthenticated: true,
      }))
    } else {
      // Limpar tokens inválidos
      localStorage.removeItem('innexgrid_auth_token')
      localStorage.removeItem('innexgrid_auth_address')
    }
  }, [address])

  // Limpar token ao desconectar wallet
  useEffect(() => {
    if (globalThis.window === undefined) return

    if (!isConnected) {
      localStorage.removeItem('innexgrid_auth_token')
      localStorage.removeItem('innexgrid_auth_address')
      setAuthState({
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  }, [isConnected])

  const login = async () => {
    if (!address || !isConnected) {
      setAuthState(prev => ({ ...prev, error: 'Wallet not connected' }))
      return null
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Criar mensagem para assinar
      const message = `Sign this message to authenticate with InnexGrid.\n\nAddress: ${address}\nTimestamp: ${Date.now()}`
      
      // Solicitar assinatura
      const signature = await signMessageAsync({ message })

      // Enviar para backend para obter JWT
      const response = await fetch(apiConfig.endpoints.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message,
          signature,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Authentication failed')
      }

      const { token } = data.data

      // Salvar token (apenas no cliente)
      if (globalThis.window !== undefined) {
        localStorage.setItem('innexgrid_auth_token', token)
        localStorage.setItem('innexgrid_auth_address', address.toLowerCase())
      }

      setAuthState({
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })

      return token
    } catch (error: unknown) {
      const errorMessage = (error && typeof error === 'object' && 'message' in error && (error as any).message) ? (error as any).message : 'Authentication failed'
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      return null
    }
  }

  const logout = () => {
    if (globalThis.window !== undefined) {
      localStorage.removeItem('innexgrid_auth_token')
      localStorage.removeItem('innexgrid_auth_address')
    }
    setAuthState({
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  }

  const getAuthHeaders = () => {
    if (!authState.token || !address) return {}
    return {
      'Authorization': `Bearer ${authState.token}`,
      'x-wallet-address': address.toLowerCase(),
    }
  }

  return {
    ...authState,
    login,
    logout,
    getAuthHeaders,
  }
}
