import axios from 'axios'
import { apiConfig } from '@/config/api'

export interface ProviderResource {
  id: string
  providerAddress: string
  resourceType: 'compute' | 'storage' | 'bandwidth' | 'sensor'
  capacity: string
  usedCapacity: string
  pricePerUnit: string
  isActive: boolean
  createdAt: string
  lastUpdated: string
}

export interface ResourceFormData {
  resourceType: 'compute' | 'storage' | 'bandwidth' | 'sensor'
  capacity: string
  pricePerUnit: string
}

/**
 * Buscar todos os recursos de um provider
 */
export async function getProviderResources(
  providerAddress: string,
  authHeaders: { Authorization?: string; 'x-wallet-address'?: string }
): Promise<ProviderResource[]> {
  try {
    const response = await axios.get(
      `${apiConfig.baseUrl}/api/providers/${providerAddress}/resources`,
      { headers: authHeaders }
    )
    const resources = response.data.data.resources || []
    // Garantir que todos os IDs sejam strings
    return resources.map((r: any) => ({
      ...r,
      id: String(r.id || '')
    }))
  } catch (error) {
    console.error('Error fetching provider resources:', error)
    return []
  }
}

/**
 * Criar um novo recurso
 */
export async function createProviderResource(
  providerAddress: string,
  data: ResourceFormData,
  authHeaders: { Authorization?: string; 'x-wallet-address'?: string }
): Promise<ProviderResource> {
  const response = await axios.post(
    `${apiConfig.baseUrl}/api/providers/${providerAddress}/resources`,
    data,
    { headers: authHeaders }
  )
  return response.data.data.resource
}

/**
 * Atualizar um recurso existente
 */
export async function updateProviderResource(
  providerAddress: string,
  resourceType: string,
  updates: Partial<Pick<ProviderResource, 'capacity' | 'pricePerUnit' | 'isActive'>>,
  authHeaders: { Authorization?: string; 'x-wallet-address'?: string }
): Promise<ProviderResource> {
  const response = await axios.put(
    `${apiConfig.baseUrl}/api/providers/${providerAddress}/resources/${resourceType}`,
    updates,
    { headers: authHeaders }
  )
  const resource = response.data.data.resource
  // Garantir que o ID seja string
  return {
    ...resource,
    id: String(resource.id || '')
  }
}

/**
 * Deletar um recurso
 */
export async function deleteProviderResource(
  providerAddress: string,
  resourceType: string,
  authHeaders: { Authorization?: string; 'x-wallet-address'?: string }
): Promise<void> {
  await axios.delete(
    `${apiConfig.baseUrl}/api/providers/${providerAddress}/resources/${resourceType}`,
    { headers: authHeaders }
  )
}

/**
 * Salvar múltiplos recursos (batch update)
 */
export async function saveMultipleResources(
  providerAddress: string,
  resources: Array<Omit<ProviderResource, 'providerAddress' | 'createdAt' | 'lastUpdated'>>,
  authHeaders: { Authorization?: string; 'x-wallet-address'?: string }
): Promise<void> {
  // Buscar recursos existentes
  const existing = await getProviderResources(providerAddress, authHeaders)
  const existingMap = new Map(existing.map(r => [r.resourceType, r]))

  // Processar cada recurso
  for (const resource of resources) {
    // Garantir que id seja string para verificação
    const resourceId = String(resource.id || '')
    const isNew = resourceId.startsWith('new-')
    const existingResource = existingMap.get(resource.resourceType)

    if (isNew && !existingResource) {
      // Criar novo recurso
      await createProviderResource(
        providerAddress,
        {
          resourceType: resource.resourceType,
          capacity: resource.capacity,
          pricePerUnit: resource.pricePerUnit,
        },
        authHeaders
      )
    } else if (existingResource) {
      // Atualizar recurso existente
      await updateProviderResource(
        providerAddress,
        resource.resourceType,
        {
          capacity: resource.capacity,
          pricePerUnit: resource.pricePerUnit,
          isActive: resource.isActive,
        },
        authHeaders
      )
    } else if (!isNew && !existingResource) {
      // Se não é novo e não existe, criar (caso o ID não seja 'new-' mas o recurso não existe)
      await createProviderResource(
        providerAddress,
        {
          resourceType: resource.resourceType,
          capacity: resource.capacity,
          pricePerUnit: resource.pricePerUnit,
        },
        authHeaders
      )
    }
  }

  // Deletar recursos que foram removidos
  for (const [type, existingResource] of existingMap) {
    const stillExists = resources.some(r => r.resourceType === type)
    if (!stillExists) {
      await deleteProviderResource(providerAddress, type, authHeaders)
    }
  }
}
