'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Cpu, Database, Wifi, Activity, Star, Clock, AlertCircle, Search, Filter, CheckCircle2 } from 'lucide-react'
import { ethers } from 'ethers'
import toast, { Toaster } from 'react-hot-toast'
import { apiConfig } from '@/config/api'
import { useAuth } from '../hooks/useAuth'
import { ResourceCardSkeleton } from '../components/ui/skeleton'
import { apiClient } from '@/lib/axios-config'
import { useLanguage } from '@/lib/language-context'
import CompleteUsageModal from '@/components/CompleteUsageModal'
import RatingModal from '@/components/RatingModal'
import ConsumerAnalytics from '@/components/ConsumerAnalytics'
import { innexGridClient } from '@/lib/innexgrid-client'

interface Resource {
  id?: string
  providerAddress: string
  resourceType: string
  capacity: string
  usedCapacity: string
  pricePerUnit: string
  reputation: string
  isActive: boolean
}

interface Reservation {
  id: string
  consumerAddress: string
  providerAddress: string
  resourceType: string
  amount: string
  expiresAt: string
  status: string
  createdAt: string
}

interface UsageRecord {
  id: string
  providerAddress: string
  resourceType: string
  amount: string
  cost: string
  status: string
  createdAt: string
}

export default function ConsumerPage() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()
  const { token, login, getAuthHeaders } = useAuth()
  const { t } = useLanguage()

  const [currentTab, setCurrentTab] = useState<'resources' | 'reservations' | 'analytics'>('resources')
  const [mounted, setMounted] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [reservationAmount, setReservationAmount] = useState('')
  const [reservationDuration, setReservationDuration] = useState('1')
  
  // Advanced filters
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [minReputation, setMinReputation] = useState('')
  const [minCapacity, setMinCapacity] = useState('')
  const [sortBy, setSortBy] = useState<'price' | 'reputation' | 'capacity' | 'none'>('none')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Complete usage modal
  const [completeUsageReservation, setCompleteUsageReservation] = useState<Reservation | null>(null)
  
  // Rating modal
  const [ratingReservation, setRatingReservation] = useState<{
    providerAddress: string
    resourceType: string
  } | null>(null)

  // Active connections
  const [activeConnections, setActiveConnections] = useState<Map<string, any>>(new Map())
  
  // Resource usage modal
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [usageTask, setUsageTask] = useState('')
  const [usageResult, setUsageResult] = useState<any>(null)

  // Mount flag for hydration-safe animations
  useEffect(() => { setMounted(true) }, [])

  // Load resources on mount
  useEffect(() => {
    if (isConnected && mounted) {
      loadResources()
      loadReservations()
      loadUsageHistory()
    }
  }, [isConnected, address, mounted])

  const loadResources = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(apiConfig.endpoints.marketplace.list)
      if (response.data.success) {
        const providers = response.data.data || []
        console.log('📊 Providers loaded:', providers.map((p: Resource) => {
          try {
            const priceFormatted = p.pricePerUnit ? ethers.formatUnits(p.pricePerUnit, 18) : '0'
            return { 
              address: p.providerAddress?.slice(0, 8),
              type: p.resourceType,
              price: p.pricePerUnit,
              priceFormatted: priceFormatted,
              priceNum: Number.parseFloat(priceFormatted),
              raw: p
            }
          } catch (e) {
            return {
              address: p.providerAddress?.slice(0, 8),
              type: p.resourceType,
              price: p.pricePerUnit,
              error: 'Failed to format price',
              raw: p
            }
          }
        }))
        setResources(providers)
      } else {
        console.warn('API returned unsuccessful response:', response.data)
        setResources([])
      }
    } catch (error) {
      console.error('Error loading resources:', error)
      toast.error('Erro ao carregar recursos do marketplace. Verifique se o backend está rodando.')
      setResources([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadReservations = async () => {
    try {
      const response = await apiClient.get(apiConfig.endpoints.consumers.reservations(address!), {
        headers: getAuthHeaders()
      })
      if (response.data.success) {
        setReservations(response.data.data || [])
      }
    } catch (error) {
      console.error('Error loading reservations:', error)
      // Reservations would be loaded when backend is ready
      setReservations([])
    }
  }

  const loadUsageHistory = async () => {
    if (!address) return
    
    try {
      const response = await apiClient.get(apiConfig.endpoints.usage.history(address), {
        headers: getAuthHeaders()
      })
      if (response.data.success) {
        setUsageHistory(response.data.data || [])
      }
    } catch (error) {
      console.error('Error loading usage history:', error)
      setUsageHistory([])
    }
  }

  const handleReserveResource = async () => {
    if (!selectedResource || !address || !reservationAmount) return

    const available = Number.parseInt(selectedResource.capacity) - Number.parseInt(selectedResource.usedCapacity)
    if (Number.parseInt(reservationAmount) > available) {
      toast.error(`Quantidade solicitada (${reservationAmount}) excede a capacidade disponível (${available} unidades)`)
      return
    }

    // Garantir autenticação antes de reservar
    let authToken = token
    if (!authToken) {
      authToken = await login()
      if (!authToken) {
        toast.error('Erro na autenticação. Tente novamente.')
        return
      }
    }

    setIsLoading(true)
    try {
      const response = await apiClient.post(apiConfig.endpoints.marketplace.reserve, {
        consumerAddress: address,
        providerAddress: selectedResource.providerAddress,
        resourceType: selectedResource.resourceType,
        amount: reservationAmount,
        duration: Number.parseInt(reservationDuration),
      }, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        }
      })

      if (response.data.success) {
        const reservationId = response.data.data.id
        
        // Conectar ao Gateway após criar a reserva
        try {
          const connection = await innexGridClient.connectToResource(
            reservationId,
            address!,
            selectedResource.providerAddress,
            selectedResource.resourceType,
            reservationAmount
          )
          
          toast.success(`Recurso reservado e conectado! Connection ID: ${connection.connectionId.substring(0, 8)}...`)
          console.log('✅ Connected to Gateway:', connection)
            } catch (gatewayError: unknown) {
              console.warn('⚠️ Failed to connect to Gateway (reservation still created):', gatewayError)
              const gwMessage = (gatewayError && typeof gatewayError === 'object' && 'message' in gatewayError) ? (gatewayError as any).message : String(gatewayError)
              toast.success('Recurso reservado com sucesso! (Conexão ao Gateway falhou - ' + (gwMessage || 'tente conectar manualmente') + ')')
        }
        
        await loadReservations()
        setSelectedResource(null)
        setReservationAmount('')
        setReservationDuration('1')
      }
    } catch (error: unknown) {
      console.error('Reservation error:', error)
      const responseMessage = (error && typeof error === 'object' && 'response' in error) ? (error as any).response?.data?.message : undefined
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(`Erro na reserva: ${responseMessage || message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelReservation = async (reservationId: string) => {
    if (!address) return

    // Garantir autenticação
    let authToken = token
    if (!authToken) {
      authToken = await login()
      if (!authToken) {
        toast.error('Erro na autenticação. Tente novamente.')
        return
      }
    }

    setIsLoading(true)
    try {
      await apiClient.post(apiConfig.endpoints.marketplace.cancelReservation(reservationId), {
        consumerAddress: address,
      }, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        }
      })

      toast.success('Reserva cancelada com sucesso!')
      await loadReservations()
    } catch (error: unknown) {
      console.error('Cancel error:', error)
      const responseMessage = (error && typeof error === 'object' && 'response' in error) ? (error as any).response?.data?.message : undefined
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(`Erro ao cancelar: ${responseMessage || message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseResource = async (reservation: Reservation) => {
    if (!address) return

    setIsLoading(true)
    try {
      // Conectar ao Gateway se ainda não conectado
      let connection = activeConnections.get(reservation.id)
      
      if (!connection) {
        const newConnection = await innexGridClient.connectToResource(
          reservation.id,
          address,
          reservation.providerAddress,
          reservation.resourceType,
          reservation.amount
        )
        connection = newConnection
        setActiveConnections(prev => new Map(prev).set(reservation.id, connection))
      }

      // Usar recurso baseado no tipo
      if (reservation.resourceType === 'compute') {
        const result = await innexGridClient.executeComputeTask({
          code: usageTask || 'console.log("Hello from InnexGrid!");',
          input: {}
        })
        setUsageResult(result)
        toast.success('Tarefa executada com sucesso!')
      } else if (reservation.resourceType === 'storage') {
        const result = await innexGridClient.storeData(
          usageTask || 'Test data',
          '/test/file.txt'
        )
        setUsageResult(result)
        toast.success('Dados armazenados com sucesso!')
      } else {
        toast(`Uso de ${reservation.resourceType} será implementado em breve`, { icon: 'ℹ️' })
      }
    } catch (error: unknown) {
      console.error('Error using resource:', error)
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(`Erro ao usar recurso: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      console.log('🔌 Iniciando desconexão...')
      
      // Marcar para prevenir reconexão automática
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('preventAutoConnect', 'true')
      }
      
      // Desconectar todas as conexões ativas do Gateway
      for (const [reservationId, connection] of activeConnections.entries()) {
        try {
          console.log('🔌 Desconectando conexão:', connection.connectionId)
          await innexGridClient.disconnect(connection.connectionId)
        } catch (error) {
          console.warn('Failed to disconnect connection:', error)
        }
      }
      setActiveConnections(new Map())
      
      // Desconectar wallet
      console.log('🔌 Desconectando wallet...')
      disconnect()
      
      toast.success('Desconectado com sucesso!')
      
      // Pequeno delay antes de redirecionar para garantir que a desconexão foi processada
      setTimeout(() => {
        router.push('/')
      }, 500)
    } catch (error: unknown) {
      console.error('Error disconnecting:', error)
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(`Erro ao desconectar: ${message}`)
    }
  }

  const handleCompleteUsage = async (reservationId: string, actualAmount: string) => {
    if (!address) return

    let authToken = token
    if (!authToken) {
      authToken = await login()
      if (!authToken) {
        toast.error('Erro na autenticação. Tente novamente.')
        return
      }
    }

    try {
      const response = await apiClient.post(
        apiConfig.endpoints.marketplace.completeReservation(reservationId),
        {
          consumerAddress: address,
          actualAmount: Number.parseInt(actualAmount),
        },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.data.success) {
        toast.success('Uso completado com sucesso! Payment processado.')
        await loadReservations()
        
        // Abrir modal de rating após completar uso
        const reservation = reservations.find(r => r.id === reservationId)
        if (reservation) {
          setRatingReservation({
            providerAddress: reservation.providerAddress,
            resourceType: reservation.resourceType
          })
        }
      }
    } catch (error: unknown) {
      console.error('Complete usage error:', error)
      const responseMessage = (error && typeof error === 'object' && 'response' in error) ? (error as any).response?.data?.message : undefined
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(`Erro ao completar uso: ${responseMessage || message}`)
      throw error
    }
  }

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!address || !ratingReservation) return

    let authToken = token
    if (!authToken) {
      authToken = await login()
      if (!authToken) {
        toast.error('Erro na autenticação. Tente novamente.')
        return
      }
    }

    try {
      const response = await apiClient.post(
        apiConfig.endpoints.ratings.create,
        {
          consumerAddress: address,
          providerAddress: ratingReservation.providerAddress,
          rating,
          comment,
        },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.data.success) {
        toast.success('Avaliação enviada com sucesso!')
        await loadResources() // Reload para atualizar reputação
      }
    } catch (error: unknown) {
      console.error('Rating error:', error)
      const responseMessage = (error && typeof error === 'object' && 'response' in error) ? (error as any).response?.data?.message : undefined
      const message = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error)
      toast.error(`Erro ao enviar avaliação: ${responseMessage || message}`)
      throw error
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'compute': return Cpu
      case 'storage': return Database
      case 'bandwidth': return Wifi
      default: return Activity
    }
  }

  const getResourceName = (type: string) => {
    switch (type) {
      case 'compute': return 'Computação'
      case 'storage': return 'Armazenamento'
      case 'bandwidth': return 'Internet/Banda'
      default: return type
    }
  }

  const getReputationColor = (reputation: string) => {
    const rep = Number.parseInt(reputation)
    if (rep >= 90) return 'text-green-600 dark:text-green-400'
    if (rep >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.resourceType.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = resourceFilter === 'all' || resource.resourceType === resourceFilter
    
    // Advanced filters
    const price = Number.parseFloat(ethers.formatUnits(resource.pricePerUnit, 18))
    const matchesPriceMin = !priceMin || price >= Number.parseFloat(priceMin)
    const matchesPriceMax = !priceMax || price <= Number.parseFloat(priceMax)
    
    const reputation = Number.parseInt(resource.reputation)
    const matchesReputation = !minReputation || reputation >= Number.parseInt(minReputation)
    
    const available = Number.parseInt(resource.capacity) - Number.parseInt(resource.usedCapacity)
    const matchesCapacity = !minCapacity || available >= Number.parseInt(minCapacity)
    
    return matchesSearch && matchesFilter && resource.isActive && 
           matchesPriceMin && matchesPriceMax && matchesReputation && matchesCapacity
  }).sort((a, b) => {
    if (sortBy === 'none') return 0
    
    let valueA: number, valueB: number
    
    if (sortBy === 'price') {
      valueA = Number.parseFloat(ethers.formatUnits(a.pricePerUnit, 18))
      valueB = Number.parseFloat(ethers.formatUnits(b.pricePerUnit, 18))
    } else if (sortBy === 'reputation') {
      valueA = Number.parseInt(a.reputation)
      valueB = Number.parseInt(b.reputation)
    } else { // capacity
      valueA = Number.parseInt(a.capacity) - Number.parseInt(a.usedCapacity)
      valueB = Number.parseInt(b.capacity) - Number.parseInt(b.usedCapacity)
    }
    
    return sortOrder === 'asc' ? valueA - valueB : valueB - valueA
  })

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
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
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🔴 Botão Desconectar clicado!')
                  handleDisconnect()
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('consumer.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t('consumer.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg">
          {[
            { id: 'resources' as const, label: t('consumer.resources') },
            { id: 'reservations' as const, label: t('consumer.reservations') },
            { id: 'analytics' as const, label: t('consumer.analytics') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                currentTab === tab.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Resources Tab */}
        {currentTab === 'resources' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Search and Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('consumer.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={resourceFilter}
                    onChange={(e) => setResourceFilter(e.target.value)}
                    className="pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="all">{t('consumer.filterAll')}</option>
                    <option value="compute">{t('consumer.computing')}</option>
                    <option value="storage">{t('consumer.storage')}</option>
                    <option value="bandwidth">{t('consumer.internet')}</option>
                  </select>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Preço Min (INGRID)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Preço Max (INGRID)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="999"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Reputação Mín
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={minReputation}
                    onChange={(e) => setMinReputation(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Capacidade Mín
                  </label>
                  <input
                    type="number"
                    value={minCapacity}
                    onChange={(e) => setMinCapacity(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="none">Padrão</option>
                    <option value="price">Preço</option>
                    <option value="reputation">Reputação</option>
                    <option value="capacity">Capacidade Disponível</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Ordem
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setPriceMin('')
                      setPriceMax('')
                      setMinReputation('')
                      setMinCapacity('')
                      setSortBy('none')
                      setSortOrder('asc')
                      setSearchQuery('')
                      setResourceFilter('all')
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Mostrando {filteredResources.length} recurso(s)
              </div>
            </div>

            {/* Resources Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <ResourceCardSkeleton key={`skeleton-${index}`} />
                ))
              ) : filteredResources.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('consumer.noResourcesFound')}
                  </p>
                </div>
              ) : (
                filteredResources.map((resource, index) => {
                const IconComponent = getResourceIcon(resource.resourceType)
                const available = Number.parseInt(resource.capacity) - Number.parseInt(resource.usedCapacity)

                return (
                  <motion.div
                    key={`${resource.providerAddress}-${resource.resourceType}-${index}`}
                    initial={false}
                    animate={mounted ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {getResourceName(resource.resourceType)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Provider: {resource.providerAddress.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('consumer.available')}</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {available.toLocaleString()} {t('provider.form.units')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('consumer.priceUnit')}</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {(() => {
                            try {
                              // Debug: log o valor recebido
                              if (!resource.pricePerUnit) {
                                console.warn('⚠️ pricePerUnit is missing for resource:', {
                                  provider: resource.providerAddress,
                                  type: resource.resourceType,
                                  resource
                                })
                                return 'N/A'
                              }
                              
                              // Converter para string (pricePerUnit já é string na interface)
                              const priceValue = resource.pricePerUnit.trim()
                              
                              // Verificar se é zero ou vazio
                              if (!priceValue || priceValue === '0' || priceValue === '' || BigInt(priceValue) === 0n) {
                                return '0.0000 INGRID'
                              }
                              
                              // Formatar usando ethers (assumindo 18 decimais)
                              const priceInEther = ethers.formatUnits(priceValue, 18)
                              const priceNum = Number.parseFloat(priceInEther)
                              
                              // Verificar se o número é válido
                              if (isNaN(priceNum) || priceNum === 0) {
                                console.warn('⚠️ Invalid price number:', { priceValue, priceInEther, priceNum })
                                return '0.0000 INGRID'
                              }
                              
                              // Mostrar mais casas decimais se o número for muito pequeno
                              if (priceNum < 0.0001) {
                                return `${priceNum.toFixed(8)} ${t('provider.form.ingrid')}`
                              }
                              
                              // Formatar com 4 casas decimais
                              return `${priceNum.toFixed(4)} ${t('provider.form.ingrid')}`
                            } catch (error) {
                              console.error('❌ Error formatting price:', error, {
                                pricePerUnit: resource.pricePerUnit,
                                type: typeof resource.pricePerUnit,
                                provider: resource.providerAddress,
                                resourceType: resource.resourceType
                              })
                              return 'Erro'
                            }
                          })()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('consumer.reputation')}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-current text-yellow-500" />
                          <span className={`font-semibold ${getReputationColor(resource.reputation)}`}>
                            {resource.reputation}/100
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(available / Number.parseInt(resource.capacity)) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedResource(resource)}
                      disabled={available === 0}
                      className="w-full bg-orange-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {available === 0 ? t('consumer.unavailable') : t('consumer.reserveResource')}
                    </button>
                  </motion.div>
                )
              }))}
            </div>
          </motion.div>
        )}

        {/* Reservations Tab */}
        {currentTab === 'reservations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('consumer.activeReservations')}</h3>

              {reservations.length > 0 ? (
                <div className="space-y-4">
                  {reservations.map((reservation, index) => (
                    <motion.div
                      key={`${reservation.id || reservation.providerAddress}-${index}`}
                      initial={false}
                      animate={mounted ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          reservation.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                        }`}>
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {reservation.amount} unidades de {getResourceName(reservation.resourceType)}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Provider: {reservation.providerAddress.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Expira em: {new Date(reservation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {reservation.status === 'active' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedReservation(reservation)
                              setShowUsageModal(true)
                            }}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-1"
                          >
                            <Cpu className="w-4 h-4" />
                            Usar Recurso
                          </button>
                          <button
                            onClick={() => setCompleteUsageReservation(reservation)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {t('consumer.complete')}
                          </button>
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                          >
                            {t('consumer.cancel')}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('consumer.noReservations')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('consumer.reservationsMessage')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {currentTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ConsumerAnalytics usageHistory={usageHistory} />
          </motion.div>
        )}

        {/* Reservation Modal */}
        {selectedResource && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('consumer.resourceModal.title')} {getResourceName(selectedResource.resourceType)}
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="reservation-amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('consumer.resourceModal.desiredQuantity')}
                  </label>
                  <input
                    id="reservation-amount"
                    type="number"
                    min="1"
                    max={Number.parseInt(selectedResource.capacity) - Number.parseInt(selectedResource.usedCapacity)}
                    value={reservationAmount}
                    onChange={(e) => setReservationAmount(e.target.value)}
                    placeholder={t('consumer.resourceModal.example')}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('consumer.resourceModal.available')}: {Number.parseInt(selectedResource.capacity) - Number.parseInt(selectedResource.usedCapacity)} {t('provider.form.units')}
                  </p>
                </div>

                <div>
                  <label htmlFor="reservation-duration" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('consumer.resourceModal.duration')}
                  </label>
                  <select
                    id="reservation-duration"
                    value={reservationDuration}
                    onChange={(e) => setReservationDuration(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="1">{t('consumer.resourceModal.hours1')}</option>
                    <option value="6">{t('consumer.resourceModal.hours6')}</option>
                    <option value="12">{t('consumer.resourceModal.hours12')}</option>
                    <option value="24">{t('consumer.resourceModal.hours24')}</option>
                  </select>
                </div>

                {reservationAmount && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">{t('consumer.resourceModal.reservationSummary')}</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-700 dark:text-blue-400">
                        {t('consumer.resourceModal.quantity')}: <span className="font-semibold">{reservationAmount} {t('provider.form.units')}</span>
                      </p>
                      <p className="text-blue-700 dark:text-blue-400">
                        {t('consumer.resourceModal.durationLabel')}: <span className="font-semibold">{reservationDuration} horas</span>
                      </p>
                      <p className="text-blue-700 dark:text-blue-400">
                        {t('consumer.resourceModal.totalCost')}: <span className="font-semibold">
                          {(Number.parseInt(reservationAmount) * Number.parseFloat(ethers.formatUnits(selectedResource.pricePerUnit, 18))).toFixed(4)} {t('provider.form.ingrid')}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedResource(null)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('consumer.resourceModal.cancelButton')}
                </button>
                <button
                  onClick={handleReserveResource}
                  disabled={isLoading || !reservationAmount}
                  className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? t('consumer.resourceModal.reserving') : t('consumer.resourceModal.confirmButton')}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Complete Usage Modal */}
        {completeUsageReservation && (
          <CompleteUsageModal
            reservation={completeUsageReservation}
            onClose={() => setCompleteUsageReservation(null)}
            onComplete={handleCompleteUsage}
          />
        )}

        {/* Rating Modal */}
        {ratingReservation && (
          <RatingModal
            providerAddress={ratingReservation.providerAddress}
            resourceType={ratingReservation.resourceType}
            onClose={() => setRatingReservation(null)}
            onSubmit={handleSubmitRating}
          />
        )}

        {/* Use Resource Modal */}
        {showUsageModal && selectedReservation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Usar Recurso: {getResourceName(selectedReservation.resourceType)}
              </h3>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Provider:</strong> {selectedReservation.providerAddress.slice(0, 10)}...
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Quantidade:</strong> {selectedReservation.amount} unidades
                  </p>
                </div>

                {selectedReservation.resourceType === 'compute' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Código JavaScript para executar:
                    </label>
                    <textarea
                      value={usageTask}
                      onChange={(e) => setUsageTask(e.target.value)}
                      placeholder='console.log("Hello from InnexGrid!");'
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-mono text-sm"
                      rows={8}
                    />
                  </div>
                )}

                {selectedReservation.resourceType === 'storage' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Dados para armazenar:
                    </label>
                    <textarea
                      value={usageTask}
                      onChange={(e) => setUsageTask(e.target.value)}
                      placeholder="Digite os dados que deseja armazenar..."
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      rows={6}
                    />
                  </div>
                )}

                {usageResult && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Resultado:</h4>
                    <pre className="text-sm text-green-700 dark:text-green-400 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(usageResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUsageModal(false)
                    setSelectedReservation(null)
                    setUsageTask('')
                    setUsageResult(null)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleUseResource(selectedReservation)}
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Processando...' : 'Executar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
