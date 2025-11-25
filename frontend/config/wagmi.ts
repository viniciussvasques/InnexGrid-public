import { configureChains, createConfig, Chain } from 'wagmi'
import { polygonMumbai, polygon } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { http } from 'viem'

// Hardhat Local Network
const hardhatLocal: Chain = {
  id: 1337,
  name: 'Hardhat Local',
  network: 'hardhat-local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
    public: {
      http: ['http://localhost:8545'],
    },
  },
  testnet: true,
}

// Configurar providers com tratamento de erros
const { chains, publicClient } = configureChains(
  [hardhatLocal, polygonMumbai, polygon],
  [publicProvider()],
  {
    stallTimeout: 5000,
  }
)

export const config = createConfig({
  // Habilitar autoConnect para manter a conexão da wallet ao recarregar a página
  autoConnect: true,
  connectors: [
    new InjectedConnector({ 
      chains,
      options: {
        shimDisconnect: true,
      },
    }),
    new MetaMaskConnector({ 
      chains,
      options: {
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
})

// Tratamento de erros de conexão (especialmente no Electron)
if (typeof window !== 'undefined') {
  // No Electron, MetaMask pode não estar disponível
  // Isso é normal e não deve quebrar o app
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Filtrar erros conhecidos do Wagmi no Electron
    const errorMessage = args[0]?.toString() || '';
    if (errorMessage.includes('ConnectorNotFoundError') || 
        errorMessage.includes('Connector not found')) {
      // Silenciar este erro específico (é esperado no Electron sem MetaMask)
      return;
    }
    originalError.apply(console, args);
  };
}
