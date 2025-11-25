import { useState } from 'react'
import { useAccount } from 'wagmi'
import { apiConfig } from '@/config/api'

// Tipos de recursos mapeados
export const resourceTypes = {
  compute: 0,
  storage: 1,
  bandwidth: 2,
  sensor: 3,
} as const

interface ProviderData {
  providerAddress: string
  resourceType: bigint
  capacity: bigint
  usedCapacity: bigint
  pricePerUnit: bigint
  isActive: boolean
  reputation: bigint
  totalEarnings: bigint
  createdAt: bigint
}

export function useResourceProvider() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registerProvider = async (
    resourceType: keyof typeof resourceTypes,
    capacity: bigint,
    pricePerUnit: bigint
  ): Promise<string> => {
    if (!address) {
      throw new Error('Wallet não conectada')
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(apiConfig.endpoints.providers.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({
          providerAddress: address,
          // Backend espera string ("compute", "storage" ...), não índice numérico
          resourceType: resourceType,
          capacity: capacity.toString(),
          pricePerUnit: pricePerUnit.toString(),
        }),
      })

      // Verificar se a resposta é OK antes de tentar parsear JSON
      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message || errorData.message || errorMessage
          console.error('❌ Backend error response:', errorData)
        } catch (parseError) {
          // Se não conseguir parsear JSON, usar a mensagem padrão
          const text = await response.text()
          console.error('❌ Backend error (non-JSON):', text)
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.success) {
        const errorMessage = data.error?.message || data.message || 'Erro ao registrar provedor'
        console.error('❌ Backend returned success=false:', data)
        throw new Error(errorMessage)
      }

      setIsLoading(false)
      return data.data.transactionHash

    } catch (err: unknown) {
      setIsLoading(false)
      const errorMessage = err instanceof Error ? err.message : String(err) || 'Erro ao registrar provedor'
      console.error('❌ Registration error:', err)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getProvider = async (providerAddress: string): Promise<ProviderData | null> => {
    try {
      const response = await fetch(apiConfig.endpoints.providers.get(providerAddress))
      
      // Verificar se a resposta é bem-sucedida
      if (!response.ok) {
        // Se for erro 500 ou outro erro, retornar null (provider não encontrado)
        console.warn(`Provider ${providerAddress} not found or error: ${response.status}`)
        return null
      }
      
      const data = await response.json()

      if (!data.success || !data.data || !data.data.provider) {
        return null
      }

      const provider = data.data.provider
      
      // Verificar se o provider é válido (não é o provider vazio)
      if (!provider.providerAddress || provider.providerAddress === "0x0000000000000000000000000000000000000000" || provider.capacity === "0") {
        return null
      }
      
      return {
        providerAddress: provider.providerAddress,
        resourceType: provider.resourceType,
        capacity: BigInt(provider.capacity),
        usedCapacity: BigInt(provider.usedCapacity),
        pricePerUnit: BigInt(provider.pricePerUnit),
        isActive: provider.isActive,
        reputation: BigInt(provider.reputation),
        totalEarnings: BigInt(provider.totalEarnings),
        createdAt: BigInt(provider.createdAt),
      }
    } catch (err: unknown) {
      console.error('Erro ao buscar provedor:', err)
      return null
    }
  }

  const updateUsedCapacity = async (
    providerAddress: string,
    newUsedCapacity: bigint
  ): Promise<string> => {
    if (!address) {
      throw new Error('Wallet não conectada')
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(apiConfig.endpoints.providers.updateCapacity(providerAddress), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({
          usedCapacity: newUsedCapacity.toString(),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Erro ao atualizar capacidade')
      }

      setIsLoading(false)
      return data.data.transactionHash

    } catch (err: unknown) {
      setIsLoading(false)
      const errorMessage = err instanceof Error ? err.message : String(err) || 'Erro ao atualizar capacidade'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const distributeReward = async (providerAddress: string): Promise<string> => {
    if (!address) {
      throw new Error('Wallet não conectada')
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(apiConfig.endpoints.providers.distributeReward(providerAddress), {
        method: 'POST',
        headers: {
          'x-wallet-address': address,
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Erro ao distribuir recompensas')
      }

      setIsLoading(false)
      return data.data.transactionHash

    } catch (err: unknown) {
      setIsLoading(false)
      const errorMessage = err instanceof Error ? err.message : String(err) || 'Erro ao distribuir recompensas'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    registerProvider,
    getProvider,
    updateUsedCapacity,
    distributeReward,
    isLoading,
    error,
  }
}
