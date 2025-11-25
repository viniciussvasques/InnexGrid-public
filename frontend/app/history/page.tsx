'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { History, DollarSign, Activity, Clock, Filter } from 'lucide-react'
import axios from 'axios'
import { ethers } from 'ethers'
import toast, { Toaster } from 'react-hot-toast'
import { apiConfig } from '@/config/api'
import { useAuth } from '../hooks/useAuth'

interface UsageRecord {
  id: string
  consumerAddress: string
  providerAddress: string
  resourceType: string
  amount: string
  cost: string
  status: string
  createdAt: string
}

interface Payment {
  id: string
  fromAddress: string
  toAddress: string
  amount: string
  transactionHash: string
  status: string
  createdAt: string
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { getAuthHeaders } = useAuth()

  const [currentTab, setCurrentTab] = useState<'usage' | 'payments'>('usage')
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all') // 7d, 30d, 90d, all

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (isConnected && address) {
      loadHistory()
    }
  }, [isConnected, address, currentTab])

  const loadHistory = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      if (currentTab === 'usage') {
        const response = await axios.get(apiConfig.endpoints.usage.history(address), {
          headers: getAuthHeaders()
        })
        if (response.data.success) {
          setUsageRecords(response.data.data || [])
        }
      } else {
        const response = await axios.get(apiConfig.endpoints.payments.history, {
          params: { consumerAddress: address },
          headers: getAuthHeaders()
        })
        if (response.data.success) {
          setPayments(response.data.data || [])
        }
      }
    } catch (error: any) {
      console.error('Load history error:', error)
      toast.error(`Erro ao carregar histórico: ${error.response?.data?.message || error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const filterByDate = (date: string) => {
    const now = new Date()
    const recordDate = new Date(date)
    
    if (dateFilter === '7d') {
      return now.getTime() - recordDate.getTime() <= 7 * 24 * 60 * 60 * 1000
    }
    if (dateFilter === '30d') {
      return now.getTime() - recordDate.getTime() <= 30 * 24 * 60 * 60 * 1000
    }
    if (dateFilter === '90d') {
      return now.getTime() - recordDate.getTime() <= 90 * 24 * 60 * 60 * 1000
    }
    return true // 'all'
  }

  const filteredUsageRecords = usageRecords.filter(record => {
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    const matchesDate = filterByDate(record.createdAt)
    return matchesStatus && matchesDate
  })

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesDate = filterByDate(payment.createdAt)
    return matchesStatus && matchesDate
  })

  if (!mounted || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Conecte sua carteira</h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
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
              ← Voltar
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-mono text-green-700 dark:text-green-400">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            <History className="inline w-8 h-8 mr-2" />
            Histórico de Transações
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Visualize todo seu histórico de uso e pagamentos
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg">
          {[
            { id: 'usage' as const, label: 'Registros de Uso', icon: Activity },
            { id: 'payments' as const, label: 'Pagamentos', icon: DollarSign }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                currentTab === tab.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Filter className="inline w-4 h-4 mr-1" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="completed">Concluído</option>
                <option value="failed">Falhou</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Período
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {currentTab === 'usage' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Registros de Uso ({filteredUsageRecords.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
              </div>
            ) : filteredUsageRecords.length > 0 ? (
              <div className="space-y-4">
                {filteredUsageRecords.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        record.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : record.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {record.amount} unidades de {record.resourceType}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Provider: {record.providerAddress.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(record.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-orange-600 dark:text-orange-400">
                        {Number.parseFloat(ethers.formatUnits(record.cost, 18)).toFixed(4)} INGRID
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : record.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum registro de uso encontrado</p>
              </div>
            )}
          </div>
        )}

        {currentTab === 'payments' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Pagamentos ({filteredPayments.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
              </div>
            ) : filteredPayments.length > 0 ? (
              <div className="space-y-4">
                {filteredPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        payment.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Pagamento de {payment.fromAddress === address ? 'Saída' : 'Entrada'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.fromAddress === address ? 'Para' : 'De'}: {(payment.fromAddress === address ? payment.toAddress : payment.fromAddress).slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                        {payment.transactionHash && (
                          <a
                            href={`https://etherscan.io/tx/${payment.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Ver no Explorer →
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`font-semibold ${
                        payment.fromAddress === address
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {payment.fromAddress === address ? '-' : '+'}
                        {Number.parseFloat(ethers.formatUnits(payment.amount, 18)).toFixed(4)} INGRID
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum pagamento encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
