'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, Activity, Calendar } from 'lucide-react'
import { ethers } from 'ethers'
import { useLanguage } from '@/lib/language-context'

interface UsageRecord {
  id: string
  consumerAddress: string
  resourceType: string
  amount: string
  cost: string
  status: string
  createdAt: string
}

interface ProviderAnalyticsProps {
  usageHistory: UsageRecord[]
  currentCapacity: string
  totalCapacity: string
  totalEarnings: string
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

export default function ProviderAnalytics({ 
  usageHistory, 
  currentCapacity, 
  totalCapacity,
  totalEarnings 
}: Readonly<ProviderAnalyticsProps>) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [mounted, setMounted] = useState(false)
  const { t } = useLanguage()

  useEffect(() => { setMounted(true) }, [])

  // Filter by period
  const filterByPeriod = (records: UsageRecord[]) => {
    if (period === 'all') return records

    const now = new Date()
    let days = 90
    if (period === '7d') days = 7
    else if (period === '30d') days = 30
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    return records.filter(record => new Date(record.createdAt) >= cutoff)
  }

  const filteredHistory = filterByPeriod(usageHistory)

  // Utilization over time (daily)
  const utilizationData = () => {
    const dayMap = new Map<string, number>()
    
    for (const record of filteredHistory) {
      const date = new Date(record.createdAt).toLocaleDateString()
      const current = dayMap.get(date) || 0
      dayMap.set(date, current + Number.parseInt(record.amount))
    }

    return Array.from(dayMap.entries())
      .map(([date, amount]) => ({
        date,
        utilization: amount,
        percentage: (amount / Number.parseInt(totalCapacity)) * 100
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Revenue over time (daily)
  const revenueData = () => {
    const dayMap = new Map<string, number>()
    
    const completedRecords = filteredHistory.filter(r => r.status === 'completed')
    for (const record of completedRecords) {
      const date = new Date(record.createdAt).toLocaleDateString()
      const current = dayMap.get(date) || 0
      const revenue = Number.parseFloat(ethers.formatUnits(record.cost, 18))
      dayMap.set(date, current + revenue)
    }

    return Array.from(dayMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue: Number.parseFloat(revenue.toFixed(4))
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Breakdown by consumer
  const consumerBreakdown = () => {
    const consumerMap = new Map<string, number>()
    
    for (const record of filteredHistory) {
      const consumer = `${record.consumerAddress.slice(0, 6)}...${record.consumerAddress.slice(-4)}`
      const current = consumerMap.get(consumer) || 0
      consumerMap.set(consumer, current + Number.parseInt(record.amount))
    }

    return Array.from(consumerMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5
  }

  // Stats summary
  const stats = {
    totalUsage: filteredHistory.reduce((sum, r) => sum + Number.parseInt(r.amount), 0),
    totalRevenue: filteredHistory
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + Number.parseFloat(ethers.formatUnits(r.cost, 18)), 0),
    avgUtilization: filteredHistory.length > 0
      ? (filteredHistory.reduce((sum, r) => sum + Number.parseInt(r.amount), 0) / filteredHistory.length)
      : 0,
    currentUtilization: ((Number.parseInt(currentCapacity) / Number.parseInt(totalCapacity)) * 100)
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          {t('provider.analytics')}
        </h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                period === p
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {p === 'all' ? t('common.allTime') : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5" />
            <p className="text-sm font-medium opacity-90">Total Usage</p>
          </div>
          <p className="text-2xl font-bold">{stats.totalUsage.toLocaleString()} units</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5" />
            <p className="text-sm font-medium opacity-90">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(4)} INGRID</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm font-medium opacity-90">Avg Usage/Day</p>
          </div>
          <p className="text-2xl font-bold">{stats.avgUtilization.toFixed(0)} units</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5" />
            <p className="text-sm font-medium opacity-90">Current Utilization</p>
          </div>
          <p className="text-2xl font-bold">{stats.currentUtilization.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Over Time */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Utilization Over Time
          </h4>
          {utilizationData().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={utilizationData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316' }}
                  name="Units Used"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No usage data for this period
            </div>
          )}
        </div>

        {/* Revenue Over Time */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Over Time
          </h4>
          {revenueData().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  fill="#10b981"
                  name="Revenue (INGRID)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No revenue data for this period
            </div>
          )}
        </div>

        {/* Top Consumers */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top 5 Consumers
          </h4>
          {consumerBreakdown().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={consumerBreakdown()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {consumerBreakdown().map((entry) => (
                    <Cell key={`consumer-${entry.name}`} fill={COLORS[consumerBreakdown().indexOf(entry) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No consumer data for this period
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Key Metrics
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {filteredHistory.length}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {filteredHistory.length > 0
                  ? ((filteredHistory.filter(r => r.status === 'completed').length / filteredHistory.length) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Revenue/Transaction</span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {filteredHistory.length > 0
                  ? (stats.totalRevenue / filteredHistory.filter(r => r.status === 'completed').length).toFixed(4)
                  : 0} INGRID
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Peak Usage Day</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {utilizationData().length > 0
                  ? utilizationData().reduce((max, d) => d.utilization > max.utilization ? d : max, utilizationData()[0]).utilization
                  : 0} units
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
