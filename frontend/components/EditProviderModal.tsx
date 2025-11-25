'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit, X } from 'lucide-react'
import { ethers } from 'ethers'

interface EditProviderModalProps {
  provider: {
    address: string
    pricePerUnit: string
    capacity: string
  }
  onClose: () => void
  onSave: (pricePerUnit: string, capacity: string) => Promise<void>
}

export default function EditProviderModal({ provider, onClose, onSave }: Readonly<EditProviderModalProps>) {
  const [pricePerUnit, setPricePerUnit] = useState(
    Number.parseFloat(ethers.formatUnits(provider.pricePerUnit, 18)).toString()
  )
  const [capacity, setCapacity] = useState(provider.capacity)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Converter preço para wei
      const priceInWei = ethers.parseUnits(pricePerUnit, 18).toString()
      await onSave(priceInWei, capacity)
      onClose()
    } catch (error) {
      console.error('Edit error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Provider Settings
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Address:</strong> {provider.address.slice(0, 10)}...{provider.address.slice(-8)}
            </p>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Price Per Unit (INGRID)
            </label>
            <input
              id="price"
              type="number"
              step="0.0001"
              min="0.0001"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Current: {Number.parseFloat(ethers.formatUnits(provider.pricePerUnit, 18)).toFixed(4)} INGRID
            </p>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Total Capacity (units)
            </label>
            <input
              id="capacity"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Current: {provider.capacity} units
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              ⚠️ Changes will take effect immediately and may affect existing reservations.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !pricePerUnit || !capacity}
            className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? 'Saving...' : (
              <>
                <Edit className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
