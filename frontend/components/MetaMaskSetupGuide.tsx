'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Download, ExternalLink, X } from 'lucide-react'
import { useElectron } from '@/lib/electron'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

interface MetaMaskSetupGuideProps {
  onClose?: () => void
}

export function MetaMaskSetupGuide({ onClose }: MetaMaskSetupGuideProps) {
  const { isElectron, platform } = useElectron()
  const [isInstalled, setIsInstalled] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Verificar se MetaMask está disponível
    const checkMetaMask = () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        setIsInstalled(true)
      } else {
        setIsInstalled(false)
      }
      setChecking(false)
    }

    checkMetaMask()
    
    // Verificar periodicamente
    const interval = setInterval(checkMetaMask, 2000)
    
    return () => clearInterval(interval)
  }, [])

  if (!isElectron) {
    return null // Não mostrar no navegador
  }

  if (checking) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300">
            Verificando MetaMask...
          </p>
        </div>
      </div>
    )
  }

  if (isInstalled) {
    return null // MetaMask está instalado, não mostrar guia
  }

  const getDownloadLink = () => {
    if (platform === 'win32') {
      return 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
    }
    return 'https://metamask.io/download/'
  }

  const steps = [
    {
      title: '1. Abra o Chrome',
      description: 'Abra o navegador Google Chrome no seu computador',
      icon: ExternalLink
    },
    {
      title: '2. Instale MetaMask',
      description: 'Clique no botão abaixo para instalar a extensão MetaMask',
      icon: Download
    },
    {
      title: '3. Configure sua Wallet',
      description: 'Crie uma nova wallet ou importe uma existente',
      icon: CheckCircle
    },
    {
      title: '4. Recarregue o App',
      description: 'Feche e abra novamente o InnexGrid Desktop',
      icon: CheckCircle
    }
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  MetaMask Necessário
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Para conectar sua wallet, você precisa do MetaMask
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Quick Install */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Instalação Rápida
              </h3>
              <a
                href={getDownloadLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Instalar MetaMask no Chrome
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Steps */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Passo a Passo
              </h3>
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {step.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Alternative */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Alternativa: WalletConnect
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Você também pode usar WalletConnect para conectar com MetaMask Mobile ou outras wallets compatíveis.
              </p>
              <button
                onClick={() => {
                  // TODO: Implementar WalletConnect
                  alert('WalletConnect será implementado em breve!')
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Usar WalletConnect →
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Após instalar, recarregue o app para detectar o MetaMask
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Recarregar App
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

