'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'

interface CompleteUsageModalProps {
  reservation: {
    id: string
    resourceType: string
    amount: string
    providerAddress: string
  }
  onClose: () => void
  onComplete: (reservationId: string, actualAmount: string) => Promise<void>
}

export default function CompleteUsageModal({ reservation, onClose, onComplete }: Readonly<CompleteUsageModalProps>) {
  const [actualAmount, setActualAmount] = useState(reservation.amount)
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      await onComplete(reservation.id, actualAmount)
      onClose()
    } catch (error) {
      console.error('Complete error:', error)
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
            Complete Resource Usage
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
              <strong>Resource:</strong> {reservation.resourceType}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Reserved Amount:</strong> {reservation.amount} units
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Provider:</strong> {reservation.providerAddress.slice(0, 8)}...
            </p>
          </div>

          <div>
            <label htmlFor="actual-amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Actual Amount Used
            </label>
            <input
              id="actual-amount"
              type="number"
              min="1"
              max={reservation.amount}
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the actual amount of resource used (max: {reservation.amount} units)
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-900 dark:text-green-300">What happens next?</h4>
            </div>
            <ul className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-7">
              <li>• Payment will be processed automatically</li>
              <li>• Usage record will be created</li>
              <li>• Provider stats will be updated</li>
              <li>• You can rate this provider after</li>
            </ul>
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
            onClick={handleComplete}
            disabled={isLoading || !actualAmount || Number.parseInt(actualAmount) <= 0}
            className="flex-1 bg-green-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? 'Processing...' : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Complete Usage
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
