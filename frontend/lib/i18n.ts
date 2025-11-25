export const translations = {
  en: {
    // Landing Page
    hero: {
      title: 'Share Resources, Earn Tokens',
      subtitle: 'Join the DePIN revolution. Monetize your excess physical resources and pay only for what you actually use.',
      badge: 'Decentralized Physical Infrastructure Network',
      becomeProvider: 'Become a Provider',
      useResources: 'Use Resources',
      connectWallet: 'Connect Wallet',
      connecting: 'Connecting...',
      disconnect: 'Disconnect',
      walletNotConnected: 'Connect your wallet to start sharing and earning tokens!',
      stats: {
        sharedResources: 'Shared Resources',
        distributedTokens: 'Distributed Tokens',
        activeProviders: 'Active Providers',
        transactionsHour: 'Transactions/Hour'
      },
      catchPhrase: 'Earn Tokens by Sharing Infrastructure',
      whyChooseTitle: 'Why Choose InnexGrid?',
      whyChooseSubtitle: 'The first complete DePIN platform connecting resource providers with consumers in a truly decentralized network.',
      ctaTitle: 'Ready to Join?',
      ctaSubtitle: 'Join the DePIN revolution today. Connect your resources or consume decentralized infrastructure securely and profitably.',
      startEarning: 'Start Earning',
      feature1Title: 'Decentralized Network',
      feature1Desc: 'Globally distributed physical infrastructure for maximum reliability and availability',
      feature2Title: 'Instant Resources',
      feature2Desc: 'Access computing resources, storage and connectivity when you need them',
      feature3Title: 'Automatic Remuneration',
      feature3Desc: 'Automatically earn tokens by sharing your excess resources',
      feature4Title: 'Blockchain Security',
      feature4Desc: 'Smart contracts ensure transparency and automatic payment execution',
      features: [
        {
          title: 'Decentralized Network',
          description: 'Globally distributed physical infrastructure for maximum reliability and availability'
        },
        {
          title: 'Instant Resources',
          description: 'Access computing resources, storage and connectivity when you need them'
        },
        {
          title: 'Automatic Remuneration',
          description: 'Automatically earn tokens by sharing your excess resources'
        },
        {
          title: 'Blockchain Security',
          description: 'Smart contracts ensure transparency and automatic payment execution'
        }
      ]
    },
    nav: {
      home: 'Home'
    },

    // Provider Dashboard
    provider: {
      register: 'Register',
      dashboard: 'Dashboard',
      back: 'Back',
      walletDisconnected: 'Wallet not connected',
      connectWalletPrompt: 'Please connect your wallet to continue.',
      backHome: 'Back to Home',
      registerProvider: 'Become a Provider',
      registerDescription: 'Register your resources and start earning INGRID tokens',
      resourceTypes: {
        compute: 'Computing (CPU/GPU)',
        storage: 'Storage',
        bandwidth: 'Internet/Bandwidth',
        sensor: 'IoT Sensors',
        memory: 'Memory (RAM)'
      },
      form: {
        resourceType: 'Resource Type',
        totalCapacity: 'Total Capacity',
        priceUnit: 'Price per Unit',
        units: 'units',
        ingrid: 'INGRID',
        calcNote: 'Tokens received per unit provided',
        estimatedRevenue: 'Estimated Revenue',
        revenueNote: 'Based on 70% average usage rate',
        daily: 'INGRID/day',
        registerButton: 'Register as Provider',
        registering: 'Registering...',
        detectingResources: 'Detecting resources from your PC...',
        detectedResourcesTitle: 'Resources Detected on Your PC',
        update: 'Update',
        available: 'Available',
        capacityToProvide: 'Capacity to provide',
        max: 'max',
        onlyDetectedValues: 'Only detected values are allowed for security',
        pricePerUnit: 'Price per',
        selected: 'Selected',
        select: 'Select',
        resourcesNotDetected: 'Resources not detected',
        resourcesNotDetectedDesc: 'This feature is only available in the desktop app. Use the form below to register manually.',
        noResourcesDetected: 'No available resources detected on your PC.',
        tryDetectAgain: 'Try Detect Again',
        checkElectronConsole: 'Check Electron console (DevTools) for more details.',
        securityEnabled: 'Security Enabled',
        securityDesc: 'For security, you can only provide resources that were automatically detected on your PC. This ensures values are real and verifiable.',
        manualFormWarning: 'Warning: Since resources were not automatically detected, you can fill manually. In the desktop app, resources are detected automatically for better security.',
        orRegisterManually: 'Or register manually:'
      },
      stats: {
        capacity: 'Capacity',
        reputation: 'Reputation',
        totalEarned: 'Total Earned',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        tokens: 'Tokens'
      },
      usageHistory: 'Usage History',
      distributeRewards: 'Distribute Rewards',
      distributing: 'Distributing...',
      noUsage: 'No usage yet',
      usageMessage: 'When your resources are used, history will appear here.',
      analytics: 'Analytics',
      editProvider: 'Edit Provider',
      deactivate: 'Deactivate',
      activate: 'Activate',
      processing: 'Processing...',
      edit: 'Edit'
    },

    // Consumer Dashboard
    consumer: {
      title: 'Consumer Dashboard',
      subtitle: 'Discover and use decentralized resources paying only for what you need.',
      resources: 'Available Resources',
      reservations: 'My Reservations',
      searchPlaceholder: 'Search by resource type...',
      filterAll: 'All Resources',
      computing: 'Computing',
      storage: 'Storage',
      internet: 'Internet',
      available: 'Available',
      priceUnit: 'Price per unit',
      reputation: 'Reputation',
      reserveResource: 'Reserve Resource',
      unavailable: 'Unavailable',
      noResources: 'No resources found',
      adjustFilters: 'Try adjusting your search filters.',
      activeReservations: 'Active Reservations',
      noReservations: 'No reservations yet',
      reservationsMessage: 'When you reserve resources, they will appear here.',
      cancel: 'Cancel',
      resourceModal: {
        title: 'Reserve',
        desiredQuantity: 'Desired Quantity',
        example: 'Ex: 100',
        available: 'Available',
        duration: 'Duration (hours)',
        hours1: '1 hour',
        hours6: '6 hours',
        hours12: '12 hours',
        hours24: '24 hours',
        reservationSummary: 'Reservation Summary',
        quantity: 'Quantity',
        durationLabel: 'Duration',
        totalCost: 'Total Cost',
        cancelButton: 'Cancel',
        confirmButton: 'Confirm Reservation',
        reserving: 'Reserving...'
      },
      analytics: 'Analytics',
      complete: 'Complete',
      completeUsage: {
        title: 'Complete Resource Usage',
        actualQuantity: 'Actual Quantity Used',
        confirm: 'Complete & Pay',
        completing: 'Processing...'
      },
      rating: {
        title: 'Rate Provider',
        comment: 'Comment (optional)',
        commentPlaceholder: 'Share your experience...',
        submit: 'Submit Rating',
        submitting: 'Submitting...'
      }
    },

    // Common
    common: {
      loading: 'Loading...',
      confirm: 'Confirm',
      error: 'Error',
      success: 'Success',
      close: 'Close',
      resources: 'Resources',
      reservations: 'Reservations',
      madeWithLove: 'Made with love by the InnexGrid team',
      allTime: 'All Time'
    }
  },
  pt: {
    // Landing Page
    hero: {
      title: 'Compartilhe Recursos, Ganhe Tokens',
      subtitle: 'Una-se à revolução DePIN. Monetize seus recursos físicos excedentes e pague apenas pelo que realmente precisa usar.',
      badge: 'Rede de Infraestrutura Física Descentralizada',
      whyChooseTitle: 'Por que escolher o InnexGrid?',
      whyChooseSubtitle: 'A primeira plataforma DePIN completa, conectando provedores de recursos com consumidores em uma rede verdadeiramente descentralizada.',
      ctaTitle: 'Pronto para participar?',
      ctaSubtitle: 'Junte-se à revolução DePIN hoje mesmo. Conecte seus recursos ou consuma infraestrutura descentralizada de forma segura e rentável.',
      startEarning: 'Começar a Ganhar',
      feature1Title: 'Rede Descentralizada',
      feature1Desc: 'Infraestrutura física distribuída globalmente para máxima confiabilidade e disponibilidade',
      feature2Title: 'Recursos Instantâneos',
      feature2Desc: 'Acesse recursos computacionais, armazenamento e conectividade quando precisar',
      feature3Title: 'Remuneração Automática',
      feature3Desc: 'Ganhe tokens automaticamente pelo compartilhamento de seus recursos excedentes',
      feature4Title: 'Segurança Blockchain',
      feature4Desc: 'Contratos inteligentes garantem transparência e execução automática de pagamentos',
      becomeProvider: 'Tornar-se Provedor',
      useResources: 'Usar Recursos',
      connectWallet: 'Conectar Carteira',
      walletNotConnected: 'Conecte sua wallet para começar a compartilhar e ganhar tokens!',
      connecting: 'Conectando...',
      disconnect: 'Desconectar',
      catchPhrase: 'Ganhe Tokens Compartilhando Infraestrutura',
      stats: {
        sharedResources: 'Recursos Compartilhados',
        distributedTokens: 'Tokens Distribuídos',
        activeProviders: 'Provedores Ativos',
        transactionsHour: 'Transações/Hora'
      },
      features: [
        {
          title: 'Rede Descentralizada',
          description: 'Infraestrutura física distribuída globalmente para máxima confiabilidade e disponibilidade'
        },
        {
          title: 'Recursos Instantâneos',
          description: 'Acesse recursos computacionais, armazenamento e conectividade quando precisar'
        },
        {
          title: 'Remuneração Automática',
          description: 'Ganhe tokens automaticamente pelo compartilhamento de seus recursos excedentes'
        },
        {
          title: 'Segurança Blockchain',
          description: 'Contratos inteligentes garantem transparência e execução automática de pagamentos'
        }
      ]
    },
    nav: {
      home: 'Início'
    },

    // Provider Dashboard
    provider: {
      register: 'Registrar',
      dashboard: 'Dashboard',
      back: 'Voltar',
      walletDisconnected: 'Carteira não conectada',
      connectWalletPrompt: 'Por favor, conecte sua carteira para continuar.',
      backHome: 'Voltar ao Início',
      registerProvider: 'Tornar-se Provedor',
      registerDescription: 'Registre seus recursos e comece a ganhar tokens INGRID',
      resourceTypes: {
        compute: 'Computação (CPU/GPU)',
        storage: 'Armazenamento',
        bandwidth: 'Internet/Banda',
        sensor: 'Sensores IoT'
      },
      form: {
        resourceType: 'Tipo de Recurso',
        totalCapacity: 'Capacidade Total',
        priceUnit: 'Preço por Unidade',
        units: 'unidades',
        ingrid: 'INGRID',
        calcNote: 'Tokens recebidos por unidade fornecida',
        estimatedRevenue: 'Receita Estimada',
        revenueNote: 'Baseado no uso médio de 70% da capacidade',
        daily: 'INGRID/dia',
        registerButton: 'Registrar como Provedor',
        registering: 'Registrando...',
        detectingResources: 'Detectando recursos do seu PC...',
        detectedResourcesTitle: 'Recursos Detectados no Seu PC',
        update: 'Atualizar',
        available: 'Disponível',
        capacityToProvide: 'Capacidade a fornecer',
        max: 'máx',
        onlyDetectedValues: 'Apenas valores detectados são permitidos para segurança',
        pricePerUnit: 'Preço por',
        selected: 'Selecionado',
        select: 'Selecionar',
        resourcesNotDetected: 'Recursos não detectados',
        resourcesNotDetectedDesc: 'Esta funcionalidade está disponível apenas no app desktop. Use o formulário abaixo para registrar manualmente.',
        noResourcesDetected: 'Nenhum recurso disponível detectado no seu PC.',
        tryDetectAgain: 'Tentar Detectar Novamente',
        checkElectronConsole: 'Verifique o console do Electron (DevTools) para mais detalhes.',
        securityEnabled: 'Segurança Ativada',
        securityDesc: 'Por segurança, você só pode fornecer recursos que foram detectados automaticamente no seu PC. Isso garante que os valores são reais e verificáveis.',
        manualFormWarning: 'Atenção: Como os recursos não foram detectados automaticamente, você pode preencher manualmente. No app desktop, os recursos são detectados automaticamente para maior segurança.',
        orRegisterManually: 'Ou registre manualmente:'
      },
      stats: {
        capacity: 'Capacidade',
        reputation: 'Reputação',
        totalEarned: 'Total Ganho',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
        tokens: 'Tokens'
      },
      usageHistory: 'Histórico de Uso',
      distributeRewards: 'Distribuir Recompensas',
      distributing: 'Distribuindo...',
      noUsage: 'Nenhum uso ainda',
      usageMessage: 'Quando seus recursos forem utilizados, o histórico aparecerá aqui.',
      analytics: 'Análises',
      editProvider: 'Editar Provedor',
      deactivate: 'Desativar',
      activate: 'Ativar',
      processing: 'Processando...',
      edit: 'Editar'
    },

    // Consumer Dashboard
    consumer: {
      title: 'Painel do Consumidor',
      subtitle: 'Descubra e use recursos descentralizados pagando apenas pelo que precisa.',
      resources: 'Recursos Disponíveis',
      reservations: 'Minhas Reservas',
      searchPlaceholder: 'Buscar por tipo de recurso...',
      filterAll: 'Todos os Recursos',
      computing: 'Computação',
      storage: 'Armazenamento',
      internet: 'Internet',
      available: 'Disponível',
      priceUnit: 'Preço por unidade',
      reputation: 'Reputação',
      reserveResource: 'Reservar Recurso',
      unavailable: 'Indisponível',
      noResources: 'Nenhum recurso encontrado',
      adjustFilters: 'Tente ajustar seus filtros de busca.',
      activeReservations: 'Reservas Ativas',
      noReservations: 'Nenhuma reserva ainda',
      reservationsMessage: 'Quando você reservar recursos, eles aparecerão aqui.',
      cancel: 'Cancelar',
      resourceModal: {
        title: 'Reservar',
        desiredQuantity: 'Quantidade desejada',
        example: 'Ex: 100',
        available: 'Disponível',
        duration: 'Duração (horas)',
        hours1: '1 hora',
        hours6: '6 horas',
        hours12: '12 horas',
        hours24: '24 horas',
        reservationSummary: 'Resumo da Reserva',
        quantity: 'Quantidade',
        durationLabel: 'Duração',
        totalCost: 'Custo Total',
        cancelButton: 'Cancelar',
        confirmButton: 'Confirmar Reserva',
        reserving: 'Reservando...'
      },
      analytics: 'Análises',
      complete: 'Completar',
      completeUsage: {
        title: 'Completar Uso do Recurso',
        actualQuantity: 'Quantidade Real Utilizada',
        confirm: 'Completar & Pagar',
        completing: 'Processando...'
      },
      rating: {
        title: 'Avaliar Provedor',
        comment: 'Comentário (opcional)',
        commentPlaceholder: 'Compartilhe sua experiência...',
        submit: 'Enviar Avaliação',
        submitting: 'Enviando...'
      }
    },

    // Common
    common: {
      loading: 'Carregando...',
      confirm: 'Confirmar',
      error: 'Erro',
      success: 'Sucesso',
      close: 'Fechar',
      resources: 'Recursos',
      reservations: 'Reservas',
      madeWithLove: 'Feito com amor pela equipe InnexGrid',
      allTime: 'Todo Período'
    }
  }
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en

// Simple translation function that works with nested objects
function getNestedTranslation(obj: any, path: string): string {
  const keys = path.split(/[.[\]]/).filter(k => k !== '') // split on dots or brackets
  let result = obj

  for (const key of keys) {
    // Handle array indices
    if (/^\d+$/.test(key) && Array.isArray(result)) {
      result = result[Number.parseInt(key)]
    } else if (result && typeof result === 'object') {
      result = result[key]
    } else {
      return path // fallback to key path if not found
    }
  }

  return typeof result === 'string' ? result : path
}
