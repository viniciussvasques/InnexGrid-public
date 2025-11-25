'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { ethers } from 'ethers'

interface UsageRecord {
  id: string
  providerAddress: string
  resourceType: string
  amount: string
  cost: string
  status: string
  createdAt: string
}

interface ConsumerAnalyticsProps {
  usageHistory: UsageRecord[]
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b']

export default function ConsumerAnalytics({ usageHistory }: Readonly<ConsumerAnalyticsProps>) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [mounted, setMounted] = useState(false)

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

  // Spending over time (daily)
  const spendingData = () => {
    const dayMap = new Map<string, number>()
    
    const completedRecords = filteredHistory.filter(r => r.status === 'completed')
    for (const record of completedRecords) {
      const date = new Date(record.createdAt).toLocaleDateString()
      const current = dayMap.get(date) || 0
      const cost = Number.parseFloat(ethers.formatUnits(record.cost, 18))
      dayMap.set(date, current + cost)
    }

    return Array.from(dayMap.entries())
      .map(([date, spending]) => ({
        date,
        spending: Number.parseFloat(spending.toFixed(4))
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Breakdown by resource type
  const resourceBreakdown = () => {
    const typeMap = new Map<string, { amount: number; cost: number }>()
    
    for (const record of filteredHistory) {
      const current = typeMap.get(record.resourceType) || { amount: 0, cost: 0 }
      typeMap.set(record.resourceType, {
        amount: current.amount + Number.parseInt(record.amount),
        cost: current.cost + Number.parseFloat(ethers.formatUnits(record.cost, 18))
      })
    }

    return Array.from(typeMap.entries())
      .map(([name, data]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value: data.amount,
        cost: Number.parseFloat(data.cost.toFixed(4))
      }))
      .sort((a, b) => b.cost - a.cost)
  }

  // Stats summary
  const stats = {
    totalSpending: filteredHistory
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + Number.parseFloat(ethers.formatUnits(r.cost, 18)), 0),
    totalUsage: filteredHistory.reduce((sum, r) => sum + Number.parseInt(r.amount), 0),
    avgSpendingPerDay: 0,
    mostUsedResource: ''
  }

  // Calculate avg spending per day
  const uniqueDays = new Set(filteredHistory.map(r => new Date(r.createdAt).toLocaleDateString())).size
  stats.avgSpendingPerDay = uniqueDays > 0 ? stats.totalSpending / uniqueDays : 0

  // Find most used resource
  const breakdown = resourceBreakdown()
  stats.mostUsedResource = breakdown.length > 0 ? breakdown[0].name : 'N/A'

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          Consumer Analytics
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
              {p === 'all' ? 'All Time' : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5" />
            <p className="text-sm font-medium opacity-90">Total Spending</p>
          </div>
          <p className="text-2xl font-bold">{stats.totalSpending.toFixed(4)} INGRID</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5" />
            <p className="text-sm font-medium opacity-90">Avg Spending/Day</p>
          </div>
          <p className="text-2xl font-bold">{stats.avgSpendingPerDay.toFixed(4)} INGRID</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5" />
            <p className="text-sm font-medium opacity-90">Total Resources</p>
          </div>
          <p className="text-2xl font-bold">{stats.totalUsage.toLocaleString()} units</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5" />
            <p className="text-sm font-medium opacity-90">Most Used</p>
          </div>
          <p className="text-2xl font-bold">{stats.mostUsedResource}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Over Time */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spending Over Time
          </h4>
          {spendingData().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingData()}>
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
                  dataKey="spending" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  name="Spending (INGRID)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No spending data for this period
            </div>
          )}
        </div>

        {/* Resource Type Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spending by Resource Type
          </h4>
          {resourceBreakdown().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resourceBreakdown()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {resourceBreakdown().map((entry) => (
                    <Cell key={`resource-${entry.name}`} fill={COLORS[resourceBreakdown().indexOf(entry) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => `${value.toFixed(4)} INGRID`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No resource data for this period
            </div>
          )}
        </div>

        {/* Resource Usage Details */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resource Usage Details
          </h4>
          {resourceBreakdown().length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Resource Type
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Total Units
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Total Cost
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Avg Cost/Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resourceBreakdown().map((resource, index) => (
                    <tr 
                      key={resource.name}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {resource.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                        {resource.value.toLocaleString()} units
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        {resource.cost.toFixed(4)} INGRID
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                        {(resource.cost / resource.value).toFixed(6)} INGRID
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              No usage data for this period
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
