'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Zap, Globe, DollarSign, Shield, Users, Cpu } from 'lucide-react'
import { useLanguage } from '../lib/language-context'
import { LogoWithText } from './components/logo'
import dynamic from 'next/dynamic'
import { ClientOnly } from './components/ClientOnly'
import { apiConfig } from '@/config/api'
import { useElectron } from '@/lib/electron'
import { 
  createEmbeddedWallet, 
  importEmbeddedWallet, 
  loadEmbeddedWallet,
  injectEmbeddedProvider,
  removeEmbeddedWallet
} from '@/lib/embedded-wallet'

// Dynamic imports (client-only)
const ThemeToggle = dynamic(() => import('./components/theme-toggle').then(m => m.ThemeToggle), { ssr: false })
const LanguageSwitcher = dynamic(() => import('./components/language-switcher').then(m => m.LanguageSwitcher), { ssr: false })

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isLoading: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const router = useRouter()
  const { t } = useLanguage()
  const { isElectron } = useElectron()
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  const [showImportWallet, setShowImportWallet] = useState(false)
  const [importPrivateKey, setImportPrivateKey] = useState('')
  const [preventAutoConnect, setPreventAutoConnect] = useState(() => {
    // Verificar sessionStorage ao inicializar
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('preventAutoConnect') === 'true'
    }
    return false
  })

  // Tentar carregar wallet embutida ao montar
  useEffect(() => {
    const loadWallet = async () => {
      if (typeof window !== 'undefined') {
        const savedWallet = loadEmbeddedWallet()
        if (savedWallet && !window.ethereum) {
          console.log('📦 Wallet embutida encontrada, injetando...')
          await injectEmbeddedProvider()
        }
      }
    }
    loadWallet()
  }, [])

  // Listener para quando ethereum é injetado - tentar conectar automaticamente
  useEffect(() => {
    if (!connectors || connectors.length === 0 || !connect) return
    if (preventAutoConnect) return // Não reconectar se foi desconexão manual
    if (isConnected) return // Não tentar conectar se já estiver conectado

    const tryConnect = async () => {
      // Verificar novamente se já está conectado antes de tentar conectar
      if (isConnected) {
        console.log('✅ Já conectado, pulando conexão automática')
        return
      }
      
      if (window.ethereum && !isConnected && !preventAutoConnect) {
        console.log('🔄 Tentando conectar wallet embutida...')
        try {
          const injectedConnector = connectors.find(
            (c) => c.id === 'metaMask' || c.id === 'injected'
          )
          if (injectedConnector) {
            // Verificar se o connector já está conectado
            if (injectedConnector.id && injectedConnector.ready) {
              const isAlreadyConnected = await injectedConnector.getAccount()
              if (isAlreadyConnected) {
                console.log('✅ Connector já conectado, pulando...')
                return
              }
            }
            
            await connect({ connector: injectedConnector })
            setPreventAutoConnect(false) // Reset após conexão bem-sucedida
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('preventAutoConnect')
            }
          }
        } catch (error: any) {
          // Ignorar erro de "já conectado"
          if (error?.name === 'ConnectorAlreadyConnectedError' || error?.message?.includes('already connected')) {
            console.log('✅ Wallet já conectada, ignorando erro')
            return
          }
          console.error('Erro ao conectar wallet embutida:', error)
        }
      }
    }

    // Verificar imediatamente apenas se não foi desconexão manual e não está conectado
    if (!preventAutoConnect && !isConnected) {
      tryConnect()
    }

    // Listener para evento customizado
    const handleEthereumReady = () => {
      if (!preventAutoConnect && !isConnected) {
        setTimeout(tryConnect, 500)
      }
    }
    window.addEventListener('ethereum#initialized', handleEthereumReady)
    
    return () => {
      window.removeEventListener('ethereum#initialized', handleEthereumReady)
    }
  }, [connectors, connect, isConnected, preventAutoConnect])

  // Log quando estado de conexão mudar
  useEffect(() => {
    console.log('📊 Estado da conexão:', { isConnected, address })
  }, [isConnected, address])

  // Log quando showWalletOptions mudar
  useEffect(() => {
    console.log('💼 showWalletOptions mudou para:', showWalletOptions)
  }, [showWalletOptions])

  const handleConnect = async () => {
    console.log('🔌 handleConnect chamado')
    console.log('📋 Connectors:', connectors?.length, connectors?.map(c => c.id))
    
    // Verificar se há wallet disponível ANTES de tentar conectar
    const hasEthereum = typeof window !== 'undefined' && window.ethereum
    console.log('🔍 window.ethereum disponível:', hasEthereum)
    
    // Se não houver wallet disponível, mostrar opções
    if (!hasEthereum) {
      console.log('⚠️ Nenhuma wallet detectada, mostrando opções')
      console.log('📝 Setando showWalletOptions para true')
      setShowWalletOptions(true)
      console.log('✅ showWalletOptions setado, estado atual:', showWalletOptions)
      // Forçar re-render
      setTimeout(() => {
        console.log('🔄 Estado após timeout:', showWalletOptions)
      }, 100)
      return
    }
    
    if (!connectors || connectors.length === 0) {
      console.log('⚠️ Nenhum connector, mostrando opções')
      setShowWalletOptions(true)
      return
    }

    try {
      // Encontrar connector disponível
      const injectedConnector = connectors.find(
        (c) => c.id === 'metaMask' || c.id === 'injected'
      )

      const connectorToUse = injectedConnector || connectors[0]

      if (!connectorToUse) {
        console.log('⚠️ Nenhum connector válido, mostrando opções')
        setShowWalletOptions(true)
        return
      }

      console.log('🔌 Tentando conectar com:', connectorToUse.id)
      
      // Tentar conectar
      const result = await connect({ connector: connectorToUse })
      console.log('✅ Resultado da conexão:', result)
      
      // Aguardar um pouco para o estado atualizar
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verificar se realmente conectou
      if (isConnected && address) {
        console.log('✅ Wallet conectada com sucesso!', address)
        setShowWalletOptions(false)
      } else {
        console.warn('⚠️ Conexão reportada como sucesso mas estado não atualizado')
        // Tentar novamente após mais um tempo
        setTimeout(() => {
          if (!isConnected) {
            console.warn('⚠️ Ainda não conectado, mostrando opções')
            setShowWalletOptions(true)
          }
        }, 1000)
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao conectar wallet:', error)
      console.error('❌ Erro completo:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      })
      
      // Se usuário cancelou, não mostrar erro
      if (error?.message?.includes('User rejected') || error?.message?.includes('rejected') || error?.message?.includes('cancel')) {
        console.log('ℹ️ Usuário cancelou')
        return
      }
      
      // Se não conseguir conectar, mostrar opções
      console.log('⚠️ Mostrando opções de wallet')
      setShowWalletOptions(true)
    }
  }

  const handleCreateWallet = async () => {
    try {
      // Criar wallet embutida
      const wallet = await createEmbeddedWallet()
      
      // Injetar no window.ethereum
      const injected = await injectEmbeddedProvider()
      
      if (injected) {
        // Mostrar informações e conectar
        const message = `Nova wallet criada!\n\nEndereço: ${wallet.address}\n\n⚠️ IMPORTANTE: Salve sua chave privada em local seguro!\n\nChave Privada: ${wallet.privateKey}\n\nA wallet foi salva localmente e está pronta para usar.`
        
        if (confirm(message + '\n\nDeseja copiar a chave privada para a área de transferência?')) {
          await navigator.clipboard.writeText(wallet.privateKey)
        }
        
        setShowWalletOptions(false)
        
        // Aguardar um pouco e conectar
        setTimeout(() => {
          handleConnect()
        }, 500)
      } else {
        throw new Error('Erro ao injetar wallet')
      }
    } catch (error: any) {
      console.error('Erro ao criar wallet:', error)
      alert('Erro ao criar wallet: ' + (error?.message || 'Erro desconhecido'))
    }
  }

  const handleImportWallet = async () => {
    if (!importPrivateKey.trim()) {
      alert('Por favor, insira a chave privada')
      return
    }

    try {
      // Importar wallet
      const wallet = await importEmbeddedWallet(importPrivateKey.trim())
      
      // Injetar no window.ethereum
      const injected = await injectEmbeddedProvider()
      
      if (injected) {
        alert(`Wallet importada com sucesso!\n\nEndereço: ${wallet.address}`)
        setShowWalletOptions(false)
        setShowImportWallet(false)
        setImportPrivateKey('')
        
        // Aguardar um pouco e conectar
        setTimeout(() => {
          handleConnect()
        }, 500)
      } else {
        throw new Error('Erro ao injetar wallet')
      }
    } catch (error: any) {
      console.error('Erro ao importar wallet:', error)
      alert('Erro ao importar wallet: ' + (error?.message || 'Chave privada inválida'))
    }
  }

  const handleBecomeProvider = () => {
    if (!isConnected) {
      alert(t('hero.walletNotConnected'))
      return
    }
    router.push('/provider')
  }

  const handleUseResources = () => {
    if (!isConnected) {
      alert(t('hero.walletNotConnected'))
      return
    }
    router.push('/consumer')
  }

  // Traduções específicas
  const title = t('hero.title')
  const subtitle = t('hero.subtitle')
  const badge = t('hero.badge')
  const becomeProviderText = t('hero.becomeProvider')
  const useResourcesText = t('hero.useResources')
  const connectWalletText = t('hero.connectWallet')
  const connectingText = t('hero.connecting')
  const disconnectText = t('hero.disconnect')

  const features = [
    {
      icon: Globe,
      title: t('hero.feature1Title'),
      description: t('hero.feature1Desc')
    },
    {
      icon: Zap,
      title: t('hero.feature2Title'),
      description: t('hero.feature2Desc')
    },
    {
      icon: DollarSign,
      title: t('hero.feature3Title'),
      description: t('hero.feature3Desc')
    },
    {
      icon: Shield,
      title: t('hero.feature4Title'),
      description: t('hero.feature4Desc')
    }
  ]

  const [mounted, setMounted] = useState(false)
  const [isElectronEnv, setIsElectronEnv] = useState(false)
  const [stats, setStats] = useState([
    { label: t('hero.stats.sharedResources'), value: '0' },
    { label: t('hero.stats.distributedTokens'), value: '0' },
    { label: t('hero.stats.activeProviders'), value: '0' },
    { label: t('hero.stats.transactionsHour'), value: '0' }
  ])

  useEffect(() => {
    setMounted(true)
    // Verificar se é Electron apenas no cliente, após montar
    setIsElectronEnv(isElectron)
  }, [isElectron])

  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Carregar estatísticas do backend com cache
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true)
      try {
        const { getCachedOrFetch } = await import('@/lib/cache')
        const { apiClient } = await import('@/lib/axios-config')
        
        const data = await getCachedOrFetch(
          'home_stats',
          async () => {
            const response = await apiClient.get(apiConfig.endpoints.monitoring.stats)
            return response.data
          },
          { ttl: 5 * 60 * 1000 } // 5 minutes cache
        )

        if (data.success && data.data) {
          setStats([
            { label: t('hero.stats.sharedResources'), value: data.data.totalResources?.toLocaleString() || '0' },
            { label: t('hero.stats.distributedTokens'), value: data.data.totalTokensDistributed ? `${(Number.parseFloat(data.data.totalTokensDistributed) / 1e18 / 1e6).toFixed(1)}M` : '0' },
            { label: t('hero.stats.activeProviders'), value: data.data.activeProviders?.toLocaleString() || '0' },
            { label: t('hero.stats.transactionsHour'), value: data.data.transactionsPerHour?.toLocaleString() || '0' }
          ])
        }
      } catch (error) {
        // Manter valores padrão se API falhar
        console.error('Error loading stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }
    if (mounted) {
      loadStats()
    }
  }, [t, mounted])

  // Versão simplificada para desktop (apenas após montar para evitar erro de hidratação)
  // Renderizar versão Electron apenas após montar no cliente
  if (mounted && isElectronEnv) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
        {/* Navigation Simplificada */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <LogoWithText size="md" onClick={() => router.push('/')} />
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <LanguageSwitcher />
                {/* Wallet Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-mono text-green-700 dark:text-green-400 font-medium">
                    <ClientOnly fallback={<span className="opacity-50">0x000...0000</span>}>
                      {isConnected && address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Não conectado'}
                    </ClientOnly>
                  </span>
                </div>
                <ClientOnly fallback={<div className="w-[110px] h-8 rounded-lg bg-orange-200 animate-pulse" aria-hidden="true"/>}>
                  {isConnected ? (
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('preventAutoConnect', 'true')
                        }
                        setPreventAutoConnect(true) // Prevenir reconexão automática
                        disconnect()
                        // Se for wallet embutida, perguntar se quer remover
                        if (loadEmbeddedWallet()) {
                          if (confirm('Deseja remover a wallet embutida também?')) {
                            removeEmbeddedWallet()
                          }
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      {disconnectText}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('🖱️ Botão clicado!')
                        handleConnect()
                      }}
                      disabled={isConnecting}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isConnecting ? connectingText : connectWalletText}
                    </button>
                  )}
                </ClientOnly>
              </div>
            </div>
          </div>
        </nav>

        {/* Conteúdo Principal Simplificado */}
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
          <div className="max-w-4xl mx-auto w-full">
            <motion.div
              initial={false}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Título Simplificado */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {subtitle}
                </p>
              </div>

              {/* Botões Principais */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <button
                  onClick={handleBecomeProvider}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-xl hover:bg-orange-600 transform hover:scale-105 transition-all duration-200"
                >
                  <Users className="w-5 h-5" />
                  {becomeProviderText}
                </button>

                <button
                  onClick={handleUseResources}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transform hover:scale-105 transition-all duration-200"
                >
                  <Cpu className="w-5 h-5" />
                  {useResourcesText}
                </button>
              </div>

              {/* Aviso de Conexão */}
              <ClientOnly fallback={<div className="mt-8 h-16" aria-hidden="true" />}> 
                {!isConnected && (
                  <motion.div
                    initial={false}
                    animate={{ opacity: 1 }}
                    className="mt-8 max-w-lg mx-auto space-y-3"
                  >
                    {showWalletOptions ? (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3">
                        <p className="text-blue-800 dark:text-blue-300 text-sm mb-3 font-semibold">
                          Escolha uma opção:
                        </p>
                        
                        {showImportWallet ? (
                          <div className="space-y-2">
                            <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                              Cole sua chave privada para importar uma wallet existente:
                            </p>
                            <textarea
                              value={importPrivateKey}
                              onChange={(e) => setImportPrivateKey(e.target.value)}
                              placeholder="0x..."
                              className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleImportWallet}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                              >
                                ✅ Importar
                              </button>
                              <button
                                onClick={() => {
                                  setShowImportWallet(false)
                                  setImportPrivateKey('')
                                }}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <button
                              onClick={async () => {
                                setShowWalletOptions(false)
                                await handleConnect()
                              }}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors text-left"
                            >
                              🔌 Conectar Wallet Externa (se disponível)
                            </button>
                            <button
                              onClick={handleCreateWallet}
                              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors text-left"
                            >
                              ➕ Criar Nova Wallet (Recomendado)
                            </button>
                            <button
                              onClick={() => setShowImportWallet(true)}
                              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors text-left"
                            >
                              📥 Importar Wallet Existente
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                        <p className="text-yellow-800 dark:text-yellow-300 flex items-center justify-center gap-2 text-sm">
                          <Zap className="w-4 h-4" />
                          Conecte sua wallet para começar
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </ClientOnly>
            </motion.div>
          </div>
        </section>
      </div>
    )
  }

  // Versão completa para web
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <LogoWithText size="md" onClick={() => router.push('/')} />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageSwitcher />
              {/* Stable container for wallet info to avoid SSR mismatch */}
              <div className="hidden md:flex items-center gap-3 min-w-[120px]">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-mono text-green-700 dark:text-green-400 font-medium">
                    <ClientOnly fallback={<span className="opacity-50">0x000...0000</span>}>
                      {isConnected && address ? `${address.slice(0,6)}...${address.slice(-4)}` : '0x000...0000'}
                    </ClientOnly>
                  </span>
                </div>
              </div>
              <ClientOnly fallback={<div className="w-[110px] h-8 rounded-lg bg-orange-200 animate-pulse" aria-hidden="true"/>}>
                {isConnected ? (
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('preventAutoConnect', 'true')
                      }
                      setPreventAutoConnect(true) // Prevenir reconexão automática
                      disconnect()
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    {disconnectText}
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {isConnecting ? connectingText : connectWalletText}
                  </button>
                )}
              </ClientOnly>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={false}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              {badge}
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
                <span className="block">{title}</span>
                <span className="block bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent">
                  {t('hero.catchPhrase')}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <button
                onClick={handleBecomeProvider}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-xl hover:bg-orange-600 transform hover:scale-105 transition-all duration-200 animate-glow"
              >
                <Users className="w-5 h-5" />
                {becomeProviderText}
              </button>

              <button
                onClick={handleUseResources}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transform hover:scale-105 transition-all duration-200"
              >
                <Cpu className="w-5 h-5" />
                {useResourcesText}
              </button>
            </div>

            {/* Connection Warning */}
            <ClientOnly fallback={<div className="mt-8 h-20" aria-hidden="true" />}> 
              {!isConnected && (
                <motion.div
                  initial={false}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 max-w-lg mx-auto space-y-3"
                >
                  {showWalletOptions ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3">
                      <p className="text-blue-800 dark:text-blue-300 text-sm mb-3 font-semibold">
                        Escolha uma opção:
                      </p>
                      
                      {showImportWallet ? (
                        <div className="space-y-2">
                          <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                            Cole sua chave privada para importar uma wallet existente:
                          </p>
                          <textarea
                            value={importPrivateKey}
                            onChange={(e) => setImportPrivateKey(e.target.value)}
                            placeholder="0x..."
                            className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleImportWallet}
                              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                            >
                              ✅ Importar
                            </button>
                            <button
                              onClick={() => {
                                setShowImportWallet(false)
                                setImportPrivateKey('')
                              }}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={async () => {
                              setShowWalletOptions(false)
                              await handleConnect()
                            }}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors text-left"
                          >
                            🔌 Conectar Wallet Externa (se disponível)
                          </button>
                          <button
                            onClick={handleCreateWallet}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors text-left"
                          >
                            ➕ Criar Nova Wallet (Recomendado)
                          </button>
                          <button
                            onClick={() => setShowImportWallet(true)}
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors text-left"
                          >
                            📥 Importar Wallet Existente
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                      <p className="text-yellow-800 dark:text-yellow-300 flex items-center justify-center gap-2 text-sm">
                        <Zap className="w-4 h-4" />
                        Conecte sua wallet para começar a compartilhar e ganhar tokens!
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </ClientOnly>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={false}
            whileInView={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {isLoadingStats ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="animate-pulse">
                    <div className="h-12 md:h-16 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                  </div>
                </motion.div>
              ))
            ) : (
              stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={false}
                  whileInView={mounted ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-5xl font-bold text-orange-500 dark:text-orange-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={false}
            whileInView={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('hero.whyChooseTitle')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('hero.whyChooseSubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={false}
                whileInView={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transform hover:-translate-y-2">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={false}
            whileInView={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-3xl p-8 md:p-12 text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('hero.ctaTitle')}
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              {t('hero.ctaSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleBecomeProvider}
                className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
              >
                  {t('hero.startEarning')}
              </button>

              <button
                onClick={handleUseResources}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-all duration-200"
              >
                {t('hero.useResources')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
          <p className="flex items-center justify-center gap-2">
            <span className="text-orange-500">❤️</span>
            {t('common.madeWithLove')}
          </p>
        </div>
      </footer>
    </div>
  )
}
