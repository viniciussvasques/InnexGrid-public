'use client'

import { useState, useEffect, useMemo } from 'react'
import { ethers } from 'ethers'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Server, Activity, DollarSign, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle, Info, Edit, Power, Settings, Database, Wifi, Shield } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'
import { useResourceProvider } from '../hooks/useResourceProvider'
import { useLanguage } from '@/lib/language-context'
import { apiConfig } from '@/config/api'
import { useAuth } from '../hooks/useAuth'
import EditProviderModal from '@/components/EditProviderModal'
import ProviderAnalytics from '@/components/ProviderAnalytics'
import ManageResourcesModal from '@/components/ManageResourcesModal'
import { getProviderResources, saveMultipleResources, ProviderResource } from '@/lib/provider-resources'
import { useSystemResources } from '../hooks/useSystemResources'
import { useElectron } from '@/lib/electron'
import { formatStorage, formatNetwork, bytesToGB } from '@/lib/format-resources'

const capacityMeta: Record<string, { unit: string; placeholder: string; help: string }> = {
  compute: {
    unit: 'núcleos',
    placeholder: 'Ex: 64',
    help: 'Quantidade total de núcleos de CPU (ou capacidade equivalente de GPU) que poderá alocar para consumidores.'
  },
  storage: {
    unit: 'GB',
    placeholder: 'Ex: 500',
    help: 'Total de armazenamento livre em gigabytes disponível para compartilhar (não inclua espaço já em uso por outros serviços).'
  },
  bandwidth: {
    unit: 'Mbps',
    placeholder: 'Ex: 100',
    help: 'Largura de banda média estável em megabits por segundo que você pode oferecer de forma contínua.'
  },
  sensor: {
    unit: 'sensores',
    placeholder: 'Ex: 25',
    help: 'Número de sensores IoT ativos que você disponibilizará para a rede.'
  }
}

interface ProviderStats {
  address: string
  resourceType: string
  capacity: string
  usedCapacity: string
  pricePerUnit: string
  isActive: boolean
  reputation: string
  totalEarnings: string
  createdAt: string
}

interface UsageRecord {
  id: string
  consumerAddress: string
  resourceType: string
  amount: string
  cost: string
  status: string
  createdAt: string
}

function ProviderPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { registerProvider, getProvider, isLoading, error } = useResourceProvider()
  const { t } = useLanguage()
  const { token, login, getAuthHeaders } = useAuth()
  const { resources: systemResources, loading: loadingResources, refresh: refreshResources } = useSystemResources()
  const { isElectron, gateway, resourceServer } = useElectron()
  const [mounted, setMounted] = useState(false)
  
  // Gateway e Resource Server status
  const [gatewayStatus, setGatewayStatus] = useState<{
    isRegistered: boolean
    publicEndpoint: string | null
  } | null>(null)
  const [resourceServerStatus, setResourceServerStatus] = useState<{
    isRunning: boolean
    port: number | null
    endpoint: string | null
  } | null>(null)

  const [currentTab, setCurrentTab] = useState<'register' | 'dashboard'>('register')
  const [providerStats, setProviderStats] = useState<ProviderStats | null>(null)
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showManageResourcesModal, setShowManageResourcesModal] = useState(false)
  const [providerResources, setProviderResources] = useState<ProviderResource[]>([])
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  
  // Filtros para histórico
  const [historyFilter, setHistoryFilter] = useState<'all' | 'compute' | 'storage' | 'bandwidth' | 'memory'>('all')
  const [historySort, setHistorySort] = useState<'date' | 'amount' | 'cost'>('date')
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Recursos detectados automaticamente
  const [detectedResources, setDetectedResources] = useState<Array<{
    type: string
    label: string
    available: number
    unit: string
    displayValue?: number
    displayUnit?: string
    displayFormatted?: string
    icon: any
    selected: boolean
    pricePerUnit: string
  }>>([])

  const [formData, setFormData] = useState({
    resourceType: 'compute',
    capacity: '',
    pricePerUnit: '',
  })

  // Handle client-side mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detectar recursos do sistema automaticamente
  useEffect(() => {
    console.log('🔍 Provider Page: Detecting resources...', { systemResources })
    
    if (!systemResources) {
      console.log('⚠️ Provider Page: No system resources available')
      setDetectedResources([])
      return
    }

    if (systemResources.compute) {
      console.log('✅ Provider Page: System resources found:', {
        compute: systemResources.compute,
        memory: systemResources.memory,
        storage: systemResources.storage,
        network: systemResources.network
      })
      const detected: Array<{
        type: string
        label: string
        available: number
        unit: string
        displayValue?: number
        displayUnit?: string
        displayFormatted?: string
        icon: any
        selected: boolean
        pricePerUnit: string
      }> = []

      // CPU/Compute
      if (systemResources.compute.cores > 0) {
        const availableCores = Math.floor(systemResources.compute.cores * 0.8) // 80% available
        console.log('💻 Provider Page: Compute detected', {
          totalCores: systemResources.compute.cores,
          availableCores,
          physicalCores: systemResources.compute.physicalCores
        })
        detected.push({
          type: 'compute',
          label: t('provider.resourceTypes.compute'),
          available: availableCores,
          unit: capacityMeta.compute.unit,
          icon: Activity,
          selected: false,
          pricePerUnit: '10'
        })
      }

      // Storage
      if (systemResources.storage && systemResources.storage.available > 0) {
        // 80% available for sharing
        const availableBytes = Math.floor(systemResources.storage.available * 0.8);
        const formatted = formatStorage(availableBytes);
        const availableGB = bytesToGB(availableBytes); // For calculations, keep in GB
        
        console.log('💾 Provider Page: Storage detected', {
          totalBytes: systemResources.storage.total,
          availableBytes: systemResources.storage.available,
          availableBytesFormatted: formatted.formatted,
          availableGB: availableGB.toFixed(2)
        })
        
        detected.push({
          type: 'storage',
          label: t('provider.resourceTypes.storage'),
          available: Math.round(availableGB * 100) / 100, // Round to 2 decimals for display
          unit: 'GB', // Always use GB for calculations
          displayValue: formatted.value,
          displayUnit: formatted.unit,
          displayFormatted: formatted.formatted,
          icon: Database,
          selected: false,
          pricePerUnit: '5'
        })
      }

      // Network/Bandwidth
      if (systemResources.network && systemResources.network.speed > 0) {
        // 70% available for sharing
        const availableMbps = Math.floor(systemResources.network.speed * 0.7);
        const formatted = formatNetwork(availableMbps);
        
        console.log('🌐 Provider Page: Network detected', {
          speed: systemResources.network.speed,
          unit: systemResources.network.unit,
          interfaces: systemResources.network.interfaces,
          availableMbps,
          formatted: formatted.formatted
        })
        
        detected.push({
          type: 'bandwidth',
          label: t('provider.resourceTypes.bandwidth'),
          available: availableMbps, // Keep in Mbps for calculations
          unit: 'Mbps', // Always use Mbps for calculations
          displayValue: formatted.value,
          displayUnit: formatted.unit,
          displayFormatted: formatted.formatted,
          icon: Wifi,
          selected: false,
          pricePerUnit: '2'
        })
      }

      // Memory (RAM)
      if (systemResources.memory && systemResources.memory.available > 0) {
        // 70% available for sharing
        const availableBytes = Math.floor(systemResources.memory.available * 0.7);
        const formatted = formatStorage(availableBytes);
        const availableGB = bytesToGB(availableBytes); // For calculations, keep in GB
        
        console.log('🧠 Provider Page: Memory detected', {
          totalBytes: systemResources.memory.total,
          availableBytes: systemResources.memory.available,
          availableBytesFormatted: formatted.formatted,
          availableGB: availableGB.toFixed(2)
        })
        
        if (availableGB > 0) {
          detected.push({
            type: 'memory',
            label: t('provider.resourceTypes.memory'),
            available: Math.round(availableGB * 100) / 100, // Round to 2 decimals
            unit: 'GB', // Always use GB for calculations
            displayValue: formatted.value,
            displayUnit: formatted.unit,
            displayFormatted: formatted.formatted,
            icon: Activity,
            selected: false,
            pricePerUnit: '3'
          })
        }
      }

      console.log('✅ Provider Page: Detected resources:', detected)
      setDetectedResources(detected)
    } else {
      setDetectedResources([])
    }
  }, [systemResources, t])

  // Verificar status do Gateway
  const checkGatewayStatus = async () => {
    if (!isElectron || !address) return
    
    try {
      const status = await gateway.getStatus()
      if (status.success && status.data) {
        setGatewayStatus({
          isRegistered: status.data.isRegistered,
          publicEndpoint: status.data.publicEndpoint,
        })
      }
    } catch (error) {
      console.error('Erro ao verificar status do Gateway:', error)
    }
  }

  // Verificar status do Resource Server
  const checkResourceServerStatus = async () => {
    if (!isElectron) return
    
    try {
      const status = await resourceServer.getStatus()
      if (status.success && status.data) {
        setResourceServerStatus({
          isRunning: status.data.isRunning,
          port: status.data.port,
          endpoint: status.data.endpoint,
        })
      }
    } catch (error) {
      console.error('Erro ao verificar status do Resource Server:', error)
    }
  }

  // Check if user is already a provider
  useEffect(() => {
    if (isConnected && address && mounted) {
      checkProviderStatus()
      loadProviderResources()
      
      // Se estiver no app desktop, verificar status do Gateway e Resource Server
      if (isElectron) {
        checkGatewayStatus()
        checkResourceServerStatus()
      }
    }
  }, [isConnected, address, mounted, isElectron])

  // Verificar se há recursos e permitir acesso ao dashboard
  useEffect(() => {
    if (providerResources.length > 0 && !providerStats) {
      // Se há recursos mas não há stats do blockchain, criar stats básicos
      const firstResource = providerResources[0]
      setProviderStats({
        address: address!,
        resourceType: firstResource.resourceType,
        capacity: firstResource.capacity,
        usedCapacity: firstResource.usedCapacity,
        pricePerUnit: firstResource.pricePerUnit,
        isActive: firstResource.isActive,
        reputation: '50', // Default reputation
        totalEarnings: '0',
        createdAt: new Date().toISOString(),
      })
      setCurrentTab('dashboard')
    } else if (providerResources.length > 0 && providerStats) {
      // Se já tem stats e recursos, garantir que está no dashboard
      setCurrentTab('dashboard')
    }
  }, [providerResources, address])

  // Filtrar e ordenar histórico
  const filteredHistory = useMemo(() => {
    let filtered = usageHistory
    
    if (historyFilter !== 'all') {
      filtered = filtered.filter(u => u.resourceType === historyFilter)
    }
    
    return [...filtered].sort((a, b) => {
      let comparison = 0
      if (historySort === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (historySort === 'amount') {
        comparison = Number.parseInt(a.amount) - Number.parseInt(b.amount)
      } else if (historySort === 'cost') {
        comparison = Number.parseFloat(a.cost) - Number.parseFloat(b.cost)
      }
      return historySortOrder === 'asc' ? comparison : -comparison
    })
  }, [usageHistory, historyFilter, historySort, historySortOrder])

  // Render filtered history
  const renderHistoryContent = () => {
    if (filteredHistory.length === 0 && usageHistory.length > 0) {
      return (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum registro encontrado com os filtros selecionados
          </h4>
          <button
            onClick={() => {
              setHistoryFilter('all')
              setHistorySort('date')
              setHistorySortOrder('desc')
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors mt-4"
          >
            Limpar Filtros
          </button>
        </div>
      )
    }
    
    if (filteredHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('provider.noUsage')}
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            {t('provider.usageMessage')}
          </p>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        {filteredHistory.map((usage, index) => (
          <motion.div
            key={usage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                usage.status === 'confirmed'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
              }`}>
                {usage.status === 'confirmed' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {usage.amount} {usage.resourceType === 'storage' ? 'GB' : usage.resourceType === 'bandwidth' ? 'Mbps' : 'unidades'} de {usage.resourceType}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Consumidor: {usage.consumerAddress.slice(0, 10)}...{usage.consumerAddress.slice(-6)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(usage.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600 dark:text-green-400">
                +{usage.cost} INGRID
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(usage.createdAt).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  async function loadProviderResources() {
    if (!address) return
    
    try {
      console.log('Loading provider resources for:', address)
      const resources = await getProviderResources(address, getAuthHeaders())
      console.log('Loaded resources:', resources)
      setProviderResources(resources)
      
      // Se há recursos mas não há providerStats, criar stats básicos do primeiro recurso
      if (resources.length > 0 && !providerStats) {
        const firstResource = resources[0]
        setProviderStats({
          address: address,
          resourceType: firstResource.resourceType,
          capacity: firstResource.capacity,
          usedCapacity: firstResource.usedCapacity,
          pricePerUnit: firstResource.pricePerUnit,
          isActive: firstResource.isActive,
          reputation: '50',
          totalEarnings: '0',
          createdAt: new Date().toISOString(),
        })
        setCurrentTab('dashboard')
      }
    } catch (error: unknown) {
      console.error('Error loading resources:', error)
      setProviderResources([])
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const checkProviderStatus = async () => {
    try {
      setIsLoadingStats(true)
      // Check blockchain direct
      const provider = await getProvider(address!)
      if (provider?.isActive) {
        setProviderStats({
          address: provider.providerAddress,
          resourceType: ['compute', 'storage', 'bandwidth', 'sensor'][Number(provider.resourceType)] || 'compute',
          capacity: provider.capacity.toString(),
          usedCapacity: provider.usedCapacity.toString(),
          pricePerUnit: provider.pricePerUnit.toString(),
          isActive: provider.isActive,
          reputation: provider.reputation.toString(),
          totalEarnings: provider.totalEarnings.toString(),
          createdAt: provider.createdAt.toString(),
        })
        setCurrentTab('dashboard')
        await loadUsageHistory()
      }
    } catch {
      // Ignorado: usuário ainda não é provedor
    } finally {
      setIsLoadingStats(false)
    }
  }

  const loadUsageHistory = async () => {
    if (!address) return
    
    try {
      setIsLoadingStats(true)
      // Buscar histórico de uso do backend
      const response = await axios.get(
        apiConfig.endpoints.usage.providerHistory(address),
        { headers: getAuthHeaders() }
      )
      
      if (response.data.success) {
        const records = response.data.data || []
        setUsageHistory(records.map((r: any) => ({
          id: r.id,
          consumerAddress: r.consumerAddress,
          resourceType: r.resourceType,
          amount: r.amount,
          cost: r.cost,
          status: r.status,
          createdAt: r.createdAt
        })))
      } else {
        setUsageHistory([])
      }
    } catch (error: any) {
      console.error('Error loading usage history:', error)
      // Se não houver dados, mostrar lista vazia (normal para providers novos)
      if (error.response?.status !== 404) {
        console.log('Usage history endpoint available but no data yet')
      }
      setUsageHistory([])
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!address) return

    // VALIDAÇÃO DE SEGURANÇA: Verificar se o recurso foi detectado (quando há recursos detectados)
    if (detectedResources.length > 0) {
      const selectedResource = detectedResources.find(r => r.selected)
      if (!selectedResource) {
        toast.error('Por favor, selecione um recurso detectado automaticamente')
        return
      }
      
      // Verificar se o tipo corresponde
      if (formData.resourceType !== selectedResource.type) {
        toast.error('Tipo de recurso não corresponde ao recurso selecionado')
        return
      }
      
      // Verificar se a capacidade está dentro do range detectado
      const requestedCapacity = parseInt(formData.capacity) || 0
      if (requestedCapacity < 1 || requestedCapacity > selectedResource.available) {
        toast.error(t('provider.form.capacityRangeError')
          .replace('{max}', selectedResource.available.toString())
          .replace('{unit}', selectedResource.unit))
        return
      }
      
      console.log('✅ Validação de segurança passou:', {
        resourceType: formData.resourceType,
        capacity: formData.capacity,
        maxAvailable: selectedResource.available,
        detected: true
      })
    }

    try {
      // Register via smart contract
      // Sanitiza valores
      const capacityInt = BigInt(formData.capacity.replaceAll(/\D/g, ''))
      const cleanPrice = formData.pricePerUnit.replaceAll(/[^0-9.]/g, '') || '0'
      // Converte preço decimal para unidade mínima (assumindo 18 casas decimais ERC20)
      let priceBigInt: bigint
      try {
        priceBigInt = ethers.parseUnits(cleanPrice, 18)
      } catch {
        throw new Error('Preço inválido. Use formato numérico (ex: 0.01, 2, 10.5).')
      }

      // Mapear memory para compute (até smart contract suportar memory diretamente)
      const resourceTypeForContract = formData.resourceType === 'memory' 
        ? 'compute' 
        : formData.resourceType as 'compute' | 'storage' | 'bandwidth' | 'sensor'
      
      await registerProvider(
        resourceTypeForContract,
        capacityInt,
        priceBigInt
      )

      // Mostrar notificação detalhada do recurso registrado
      const resourceName = formData.resourceType === 'compute' ? 'Compute/GPU' :
                           formData.resourceType === 'storage' ? 'Storage' :
                           formData.resourceType === 'bandwidth' ? 'Bandwidth' :
                           formData.resourceType === 'memory' ? 'Memory' : 'Resource'
      
      toast.success(
        `✅ ${resourceName} registrado com sucesso! Capacidade: ${formData.capacity} unidades`,
        { duration: 5000 }
      )

      // Recarregar recursos imediatamente
      await loadProviderResources()

      // Se estiver no app desktop, integrar com Gateway automaticamente
      if (isElectron && detectedResources.length > 0) {
        try {
          toast.loading(t('provider.form.startingResourceServer'), { id: 'gateway-setup' })
          
          // 1. Iniciar Resource Server
          const serverResult = await resourceServer.start()
          if (!serverResult.success || !serverResult.port) {
            throw new Error(serverResult.error || 'Failed to start Resource Server')
          }

          toast.loading(t('provider.form.registeringResources'), { id: 'gateway-setup' })
          
          // 2. Registrar recursos no Resource Server
          const selectedResource = detectedResources.find(r => r.selected)
          if (selectedResource) {
            await resourceServer.registerResources({
              [selectedResource.type]: {
                type: selectedResource.type,
                capacity: formData.capacity,
                available: selectedResource.available,
              }
            })
          }

          toast.loading(t('provider.form.connectingGateway'), { id: 'gateway-setup' })
          
          // 3. Registrar no Gateway
          const gatewayResult = await gateway.registerProvider(address, serverResult.port)
          if (!gatewayResult.success) {
            throw new Error(gatewayResult.error || 'Failed to register on Gateway')
          }

          // 4. Atualizar status
          setResourceServerStatus({
            isRunning: true,
            port: serverResult.port,
            endpoint: serverResult.endpoint || null,
          })
          setGatewayStatus({
            isRegistered: true,
            publicEndpoint: gatewayResult.publicEndpoint || null,
          })

          toast.success(t('provider.form.resourcesAvailable'), { id: 'gateway-setup' })
        } catch (error: unknown) {
          console.error('Gateway integration error:', error)
          const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
          toast.error(t('provider.form.gatewayWarning').replace('{error}', message), { id: 'gateway-setup' })
          // Continue even with error - resources were registered on blockchain
        }
      }

      // If success, refresh status
      setTimeout(() => checkProviderStatus(), 2000)

      // Recarregar recursos para garantir que apareçam
      await loadProviderResources()

      // Update stats immediately
      setProviderStats({
        address,
        resourceType: formData.resourceType,
        capacity: capacityInt.toString(),
        usedCapacity: '0',
        // Exibe valor original digitado, poderia também mostrar convertido
        pricePerUnit: cleanPrice,
        isActive: true,
        reputation: '50',
        totalEarnings: '0',
        createdAt: Date.now().toString(),
      })
      
      // Garantir que está no dashboard e mostrar recursos
      setCurrentTab('dashboard')
      await loadUsageHistory()
      
      // Scroll para a seção de recursos
      setTimeout(() => {
        const resourcesSection = document.getElementById('my-resources-section')
        if (resourcesSection) {
          resourcesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 500)

    } catch (error: unknown) {
      console.error('Registration error:', error)
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(t('provider.form.registrationError').replace('{error}', message || 'Unknown error'))
    }
  }

  const handleEditProvider = async (pricePerUnit: string, capacity: string) => {
    if (!address) return

    let authToken = token
    if (!authToken) {
      authToken = await login()
      if (!authToken) {
        toast.error(t('provider.form.authenticationError'))
        return
      }
    }

    try {
      const response = await axios.put(
        apiConfig.endpoints.providers.update(address),
        {
          pricePerUnit,
          capacity: Number.parseInt(capacity),
        },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.data.success) {
        toast.success(t('provider.form.providerUpdated'))
        await checkProviderStatus()
      }
    } catch (error: unknown) {
      console.error('Edit error:', error)
      const responseMessage = (error && typeof error === 'object' && 'response' in error) ? (error as any).response?.data?.message : undefined
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(t('provider.form.updateError').replace('{error}', responseMessage || message))
      throw error
    }
  }

  const handleToggleStatus = async () => {
    if (!address || !providerStats) return

    let authToken = token
    if (!authToken) {
      authToken = await login()
      if (!authToken) {
        toast.error(t('provider.form.authenticationError'))
        return
      }
    }

    setIsTogglingStatus(true)
    try {
      const response = await axios.post(
        apiConfig.endpoints.providers.toggleStatus(address),
        {},
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.data.success) {
        const newStatus = !providerStats.isActive
        toast.success(newStatus ? t('provider.form.providerActivated') : t('provider.form.providerDeactivated'))
        setProviderStats({ ...providerStats, isActive: newStatus })
      }
    } catch (error: unknown) {
      console.error('Toggle error:', error)
      const responseMessage = (error && typeof error === 'object' && 'response' in error) ? (error as any).response?.data?.message : undefined
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(t('provider.form.toggleError').replace('{error}', responseMessage || message))
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDistributeRewards = async () => {
    if (!providerStats?.address || !address) return

    setIsLoadingStats(true)
    try {
      const response = await axios.post(
        apiConfig.endpoints.providers.distributeReward(providerStats.address),
        {},
        {
          headers: {
            'x-wallet-address': address,
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.data.success) {
        toast.success(t('provider.form.rewardsDistributed').replace('{tx}', response.data.data.transactionHash.slice(0, 10) + '...'))
        // Recarregar stats para atualizar totalEarnings
        await checkProviderStatus()
      }
    } catch (error: unknown) {
      console.error('Distribution error:', error)
      const responseMessage = (error && typeof error === 'object' && 'response' in error) ? (error as any).response?.data?.message : undefined
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(t('provider.form.distributionError').replace('{error}', responseMessage || message))
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleSaveResources = async (resources: any[]) => {
    if (!address) return

    let authToken = token
    if (!authToken) {
      authToken = await login()
      if (!authToken) {
        toast.error(t('provider.form.authenticationError'))
        throw new Error('Authentication failed')
      }
    }

    try {
      const headers = getAuthHeaders()
      console.log('Saving resources:', resources)
      await saveMultipleResources(address, resources, headers)
      toast.success(t('provider.form.resourcesUpdated'))
      // Aguardar um pouco antes de recarregar para garantir que o backend processou
      setTimeout(async () => {
        await loadProviderResources()
      }, 500)
    } catch (error: unknown) {
      console.error('Save resources error:', error)
      const responseMessage = (error && typeof error === 'object' && 'response' in error) ? (error as any).response?.data?.message : undefined
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(t('provider.form.saveResourcesError').replace('{error}', responseMessage || message))
      throw error
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('provider.walletDisconnected')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t('provider.connectWalletPrompt')}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            {t('provider.backHome')}
          </button>
        </motion.div>
      </div>
    )
  }

  // Tabs configuration
  const tabs = [
    { id: 'register' as const, label: t('provider.register'), disabled: !!providerStats },
    { id: 'dashboard' as const, label: t('provider.dashboard'), disabled: !providerStats && providerResources.length === 0 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 flex items-center gap-2 font-medium transition-colors"
            >
              ← {t('provider.backHome')}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-mono text-green-700 dark:text-green-400">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x000...0000'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              disabled={tab.disabled}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                currentTab === tab.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Register Tab */}
        {currentTab === 'register' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Server className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('provider.registerProvider')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('provider.registerDescription')}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Recursos Detectados Automaticamente */}
              {loadingResources ? (
                <div className="mb-6 p-6 bg-gray-50 dark:bg-slate-700 rounded-xl text-center">
                  <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2 animate-pulse" />
                  <p className="text-gray-600 dark:text-gray-400">{t('provider.form.detectingResources')}</p>
                </div>
              ) : detectedResources.length > 0 ? (
                <div className="mb-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('provider.form.detectedResourcesTitle')}
                    </h3>
                    <button
                      type="button"
                      onClick={refreshResources}
                      className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      {t('provider.form.update')}
                    </button>
                  </div>
                  
                  {detectedResources.map((resource, index) => (
                    <motion.div
                      key={resource.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        resource.selected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            resource.selected ? 'bg-orange-500' : 'bg-gray-100 dark:bg-slate-600'
                          }`}>
                            <resource.icon className={`w-5 h-5 ${
                              resource.selected ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {resource.label}
                              </h4>
                              {resource.selected && (
                                <CheckCircle className="w-4 h-4 text-orange-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('provider.form.available')}: <span className="font-semibold text-orange-600 dark:text-orange-400">
                                {resource.displayFormatted || `${resource.available} ${resource.unit}`}
                              </span>
                            </p>
                            {resource.selected && (
                              <div className="mt-3 space-y-2">
                                <div>
                                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {t('provider.form.capacityToProvide')} ({resource.unit})
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                      ({t('provider.form.max')}: {resource.available})
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={resource.available}
                                    value={formData.resourceType === resource.type ? formData.capacity : ''}
                                    onChange={(e) => {
                                      if (formData.resourceType === resource.type) {
                                        const value = Math.min(Math.max(1, parseInt(e.target.value) || 1), resource.available)
                                        setFormData({ ...formData, capacity: value.toString() })
                                      }
                                    }}
                                    placeholder={`${t('provider.form.max')}: ${resource.available}`}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                  />
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    ⚠️ {t('provider.form.onlyDetectedValues')}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {t('provider.form.pricePerUnit')} {resource.unit} ({t('provider.form.ingrid')})
                                  </label>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.resourceType === resource.type ? formData.pricePerUnit : resource.pricePerUnit}
                                    onChange={(e) => {
                                      if (formData.resourceType === resource.type) {
                                        setFormData({ ...formData, pricePerUnit: e.target.value })
                                      }
                                    }}
                                    placeholder="10.00"
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = detectedResources.map(r => 
                              r.type === resource.type 
                                ? { ...r, selected: !r.selected }
                                : { ...r, selected: false }
                            )
                            setDetectedResources(updated)
                            if (!resource.selected) {
                              setFormData({
                                resourceType: resource.type,
                                capacity: resource.available.toString(),
                                pricePerUnit: resource.pricePerUnit
                              })
                            } else {
                              setFormData({
                                resourceType: 'compute',
                                capacity: '',
                                pricePerUnit: ''
                              })
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            resource.selected
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-500'
                          }`}
                        >
                          {resource.selected ? t('provider.form.selected') : t('provider.form.select')}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {detectedResources.some(r => r.selected) && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                            {t('provider.form.estimatedRevenue')}
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            {t('provider.form.revenueNote')} —{' '}
                            <span className="font-semibold">
                              {formData.capacity && formData.pricePerUnit 
                                ? (Number.parseFloat(formData.capacity) * Number.parseFloat(formData.pricePerUnit) * 0.7).toFixed(2)
                                : '—'} {t('provider.form.daily')}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                        {t('provider.form.resourcesNotDetected')}
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                        {systemResources ? t('provider.form.noResourcesDetected') : t('provider.form.resourcesNotDetectedDesc')}
                      </p>
                      {loadingResources && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-500">
                            {t('common.loading')}
                          </p>
                      )}
                      {!loadingResources && systemResources === null && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={refreshResources}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            🔄 {t('provider.form.tryDetectAgain')}
                          </button>
                          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                            {t('provider.form.checkElectronConsole')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de registro - só aparece se um recurso estiver selecionado */}
              {detectedResources.some(r => r.selected) && (
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={isLoading || !formData.capacity || !formData.pricePerUnit}
                  className="w-full py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Activity className="w-5 h-5 animate-spin" />
                      {t('provider.form.registering')}
                    </>
                  ) : (
                    t('provider.form.registerButton')
                  )}
                </button>
              )}

              {/* Aviso de segurança - apenas recursos detectados */}
              {detectedResources.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                        🔒 {t('provider.form.securityEnabled')}
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {t('provider.form.securityDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulário manual - APENAS se NÃO houver recursos detectados (fallback) */}
              {!detectedResources.length && (
              <form onSubmit={handleRegister} className="space-y-6" aria-label="Registro de provedor">
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ <strong>{t('provider.form.manualFormWarning')}</strong>
                  </p>
                </div>
                <div>
                  <label htmlFor="resourceType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('provider.form.resourceType')}</label>
                  <select
                    id="resourceType"
                    value={formData.resourceType}
                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
                  >
                    <option value="compute">{t('provider.resourceTypes.compute')}</option>
                    <option value="storage">{t('provider.resourceTypes.storage')}</option>
                    <option value="bandwidth">{t('provider.resourceTypes.bandwidth')}</option>
                    <option value="sensor">{t('provider.resourceTypes.sensor')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="capacity" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      {t('provider.form.totalCapacity')}{' '}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 tracking-wide">
                        {capacityMeta[formData.resourceType].unit}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        minLength={1}
                        required
                        id="capacity"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value.replaceAll(/\D/g, '') })}
                        placeholder={capacityMeta[formData.resourceType].placeholder}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors pr-4"
                        aria-describedby="capacity-help"
                      />
                    </div>
                    <p id="capacity-help" className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                      <Info className="w-3 h-3 flex-shrink-0 text-orange-500" />
                      {capacityMeta[formData.resourceType].help}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="pricePerUnit" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('provider.form.priceUnit')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        id="pricePerUnit"
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                        placeholder="10.00"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors pl-20"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded-md tracking-wide">
                        {t('provider.form.ingrid')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('provider.form.calcNote')}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        {t('provider.form.estimatedRevenue')}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        {t('provider.form.revenueNote').replace('70%', '')}70%{' '}
                        <span className="font-semibold">
                          {formData.capacity && formData.pricePerUnit ? (Number.parseFloat(formData.capacity) * Number.parseFloat(formData.pricePerUnit) * 0.7).toFixed(2) : '—'} {t('provider.form.daily')}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !formData.capacity || !formData.pricePerUnit}
                  className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('provider.form.registering')}
                    </div>
                  ) : (
                    t('provider.form.registerButton')
                  )}
                </button>
              </form>
              )}
            </div>
          </motion.div>
        )}

        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Mostrar mensagem se não há recursos nem stats */}
            {!providerStats && providerResources.length === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                  {t('provider.form.noResourcesDetected')}
                </h3>
                <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                  Add resources using the "Manage Resources" button or register as a provider.
                </p>
                <button
                  onClick={() => setCurrentTab('register')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  {t('provider.register')}
                </button>
              </div>
            )}

            {/* Stats Overview */}
            {isLoadingStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {['s1','s2','s3','s4'].map((id) => (
                  <div key={id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Gateway e Resource Server Status (apenas no app desktop) */}
            {isElectron && (gatewayStatus || resourceServerStatus) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-orange-500" />
                  Gateway Connection Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Resource Server Status */}
                  <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Resource Server</span>
                      {resourceServerStatus?.isRunning ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {resourceServerStatus?.isRunning ? (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Porta: <span className="font-mono font-semibold">{resourceServerStatus.port}</span>
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                          Endpoint: <span className="font-mono">{resourceServerStatus.endpoint}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Não iniciado</p>
                    )}
                  </div>

                  {/* Gateway Status */}
                  <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gateway</span>
                      {gatewayStatus?.isRegistered ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {gatewayStatus?.isRegistered ? (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                          Endpoint Público: <span className="font-mono">{gatewayStatus.publicEndpoint}</span>
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">✅ Conectado</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Não conectado</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isLoadingStats && (providerStats || providerResources.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('provider.stats.capacity')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {providerStats ? (
                          `${Number.parseInt(providerStats.usedCapacity)}/${Number.parseInt(providerStats.capacity)}`
                        ) : providerResources.length > 0 ? (
                          `${providerResources.reduce((sum, r) => sum + Number.parseInt(r.usedCapacity || '0'), 0)}/${providerResources.reduce((sum, r) => sum + Number.parseInt(r.capacity || '0'), 0)}`
                        ) : '0/0'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: providerStats 
                          ? `${(Number.parseInt(providerStats.usedCapacity) / Number.parseInt(providerStats.capacity)) * 100}%`
                          : providerResources.length > 0
                          ? `${(providerResources.reduce((sum, r) => sum + Number.parseInt(r.usedCapacity || '0'), 0) / providerResources.reduce((sum, r) => sum + Number.parseInt(r.capacity || '0'), 0)) * 100}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('provider.stats.reputation')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {providerStats ? providerStats.reputation : '50'}/100
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${providerStats ? Number.parseInt(providerStats.reputation) : 50}%` }}
                    ></div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('provider.stats.totalEarned')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {providerStats ? Number.parseFloat(ethers.formatUnits(providerStats.totalEarnings, 18)).toFixed(4) : '0.0000'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('provider.stats.tokens')} {t('provider.form.ingrid')}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('provider.stats.status')}</p>
                      <div className="flex items-center gap-2">
                        {providerStats ? (
                          providerStats.isActive ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <p className="text-lg font-semibold text-green-600 dark:text-green-400">{t('provider.stats.active')}</p>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500" />
                              <p className="text-lg font-semibold text-red-600 dark:text-red-400">{t('provider.stats.inactive')}</p>
                            </>
                          )
                        ) : providerResources.length > 0 ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">Recursos Configurados</p>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <p className="text-lg font-semibold text-red-600 dark:text-red-400">{t('provider.stats.inactive')}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Resources List */}
            {providerResources.length > 0 && (
              <div id="my-resources-section" className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Meus Recursos Disponibilizados
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {providerResources.length} recurso{providerResources.length > 1 ? 's' : ''} ativo{providerResources.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowManageResourcesModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Gerenciar Recursos
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providerResources.map((resource) => {
                    const configMap: Record<string, { icon: any, label: string, bgClass: string, textClass: string }> = {
                      compute: { icon: Server, label: 'Compute/GPU', bgClass: 'bg-blue-100 dark:bg-blue-900/30', textClass: 'text-blue-600 dark:text-blue-400' },
                      storage: { icon: Database, label: 'Storage', bgClass: 'bg-green-100 dark:bg-green-900/30', textClass: 'text-green-600 dark:text-green-400' },
                      bandwidth: { icon: Wifi, label: 'Bandwidth', bgClass: 'bg-purple-100 dark:bg-purple-900/30', textClass: 'text-purple-600 dark:text-purple-400' },
                      sensor: { icon: Activity, label: 'IoT Sensors', bgClass: 'bg-orange-100 dark:bg-orange-900/30', textClass: 'text-orange-600 dark:text-orange-400' }
                    }
                    const config = configMap[resource.resourceType] || { icon: Activity, label: resource.resourceType, bgClass: 'bg-gray-100 dark:bg-gray-900/30', textClass: 'text-gray-600 dark:text-gray-400' }
                    const Icon = config.icon
                    const available = Number.parseInt(resource.capacity) - Number.parseInt(resource.usedCapacity || '0')
                    const utilization = (Number.parseInt(resource.usedCapacity || '0') / Number.parseInt(resource.capacity)) * 100
                    
                    return (
                      <motion.div
                        key={resource.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-orange-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${config.bgClass} rounded-xl flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${config.textClass}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{config.label}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {ethers.formatUnits(resource.pricePerUnit, 18)} INGRID/unidade
                              </p>
                            </div>
                          </div>
                          {resource.isActive ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Ativo</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Inativo</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3 mt-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Capacidade Total:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {Number.parseInt(resource.capacity)} {config.label === 'Storage' ? 'GB' : config.label === 'Bandwidth' ? 'Mbps' : 'unidades'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Disponível:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {available} {config.label === 'Storage' ? 'GB' : config.label === 'Bandwidth' ? 'Mbps' : 'unidades'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Em Uso:</span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {Number.parseInt(resource.usedCapacity || '0')} {config.label === 'Storage' ? 'GB' : config.label === 'Bandwidth' ? 'Mbps' : 'unidades'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${utilization}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                            {utilization.toFixed(1)}% utilizado
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Usage History */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('provider.usageHistory')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {usageHistory.length} registro{usageHistory.length !== 1 ? 's' : ''} de uso
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Filtros */}
                  <div className="flex gap-2">
                    <select
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value as any)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">Todos os tipos</option>
                      <option value="compute">Compute</option>
                      <option value="storage">Storage</option>
                      <option value="bandwidth">Bandwidth</option>
                      <option value="memory">Memory</option>
                    </select>
                    <select
                      value={historySort}
                      onChange={(e) => setHistorySort(e.target.value as any)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="date">Data</option>
                      <option value="amount">Quantidade</option>
                      <option value="cost">Valor</option>
                    </select>
                    <button
                      onClick={() => setHistorySortOrder(historySortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600"
                    >
                      {historySortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {providerResources.length === 0 && (
                      <button
                        onClick={() => setShowManageResourcesModal(true)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Manage Resources
                      </button>
                    )}
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {t('provider.edit')}
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      providerStats?.isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    {(() => {
                      if (isTogglingStatus) return t('provider.processing')
                      return providerStats?.isActive ? t('provider.deactivate') : t('provider.activate')
                    })()}
                  </button>
                  <button
                    onClick={handleDistributeRewards}
                    disabled={isLoadingStats}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {isLoadingStats ? t('provider.distributing') : t('provider.distributeRewards')}
                  </button>
                </div>
              </div>

              {renderHistoryContent()}
            </div>

            {/* Analytics Section - Mostrar sempre que houver recursos */}
            {(providerStats || providerResources.length > 0) && (
              <ProviderAnalytics
                usageHistory={usageHistory}
                currentCapacity={providerStats?.usedCapacity || providerResources.reduce((sum, r) => sum + Number.parseInt(r.usedCapacity || '0'), 0).toString()}
                totalCapacity={providerStats?.capacity || providerResources.reduce((sum, r) => sum + Number.parseInt(r.capacity || '0'), 0).toString()}
                totalEarnings={providerStats?.totalEarnings || '0'}
              />
            )}
          </motion.div>
        )}

        {/* Edit Provider Modal */}
        {showEditModal && providerStats && (
          <EditProviderModal
            provider={{
              address: providerStats.address,
              pricePerUnit: ethers.parseUnits(providerStats.pricePerUnit, 18).toString(),
              capacity: providerStats.capacity,
            }}
            onClose={() => setShowEditModal(false)}
            onSave={handleEditProvider}
          />
        )}

        {/* Manage Resources Modal */}
        {showManageResourcesModal && address && (
          <ManageResourcesModal
            providerAddress={address}
            existingResources={providerResources.map(r => ({
              id: String(r.id), // Garantir que id seja sempre string
              resourceType: r.resourceType,
              capacity: r.capacity,
              pricePerUnit: r.pricePerUnit,
              isActive: r.isActive
            }))}
            onClose={async () => {
              setShowManageResourcesModal(false)
              // Recarregar recursos quando o modal fechar
              await loadProviderResources()
            }}
            onSave={handleSaveResources}
          />
        )}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(ProviderPage), { ssr: false })
