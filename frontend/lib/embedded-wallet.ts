/**
 * Wallet embutida - Funciona sem extensões
 * Permite criar ou importar uma wallet e usá-la diretamente no app
 * COM CRIPTOGRAFIA para segurança
 */

import { ethers } from 'ethers'

const STORAGE_KEY = 'innexgrid_embedded_wallet'
const ENCRYPTED_KEY = 'innexgrid_encrypted_wallet'

export interface EmbeddedWallet {
  address: string
  privateKey: string // Criptografado
  createdAt: number
  encrypted?: boolean
}

/**
 * Criptografar chave privada usando Web Crypto API
 */
async function encryptPrivateKey(privateKey: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(privateKey)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  )
  
  // Combinar salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)
  
  // Converter para base64 para armazenamento
  return btoa(String.fromCharCode(...combined))
}

/**
 * Descriptografar chave privada
 */
async function decryptPrivateKey(encryptedData: string, password: string): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const encrypted = combined.slice(28)
    
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    )
    
    return new TextDecoder().decode(decrypted)
  } catch (error) {
    throw new Error('Senha incorreta ou dados corrompidos')
  }
}

/**
 * Solicitar senha do usuário
 */
async function requestPassword(action: 'create' | 'unlock'): Promise<string> {
  return new Promise((resolve, reject) => {
    const password = prompt(
      action === 'create' 
        ? 'Crie uma senha para proteger sua wallet (mínimo 8 caracteres):'
        : 'Digite a senha para desbloquear sua wallet:'
    )
    
    if (!password) {
      reject(new Error('Senha não fornecida'))
      return
    }
    
    if (action === 'create' && password.length < 8) {
      alert('Senha deve ter no mínimo 8 caracteres')
      reject(new Error('Senha muito curta'))
      return
    }
    
    resolve(password)
  })
}

/**
 * Criar nova wallet embutida (com criptografia)
 */
export async function createEmbeddedWallet(): Promise<EmbeddedWallet> {
  const wallet = ethers.Wallet.createRandom()
  
  // Solicitar senha do usuário
  const password = await requestPassword('create')
  
  // Criptografar chave privada
  const encryptedPrivateKey = await encryptPrivateKey(wallet.privateKey, password)
  
  const embeddedWallet: EmbeddedWallet = {
    address: wallet.address,
    privateKey: encryptedPrivateKey, // Criptografado
    createdAt: Date.now(),
    encrypted: true
  }
  
  // Salvar no localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(embeddedWallet))
    // Salvar hash da senha para verificação (não a senha em si)
    const passwordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    localStorage.setItem(ENCRYPTED_KEY, btoa(String.fromCharCode(...new Uint8Array(passwordHash))))
  }
  
  return embeddedWallet
}

/**
 * Importar wallet existente usando chave privada (com criptografia)
 */
export async function importEmbeddedWallet(privateKey: string): Promise<EmbeddedWallet> {
  try {
    const wallet = new ethers.Wallet(privateKey)
    
    // Solicitar senha do usuário
    const password = await requestPassword('create')
    
    // Criptografar chave privada
    const encryptedPrivateKey = await encryptPrivateKey(wallet.privateKey, password)
    
    const embeddedWallet: EmbeddedWallet = {
      address: wallet.address,
      privateKey: encryptedPrivateKey, // Criptografado
      createdAt: Date.now(),
      encrypted: true
    }
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(embeddedWallet))
      // Salvar hash da senha
      const passwordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
      localStorage.setItem(ENCRYPTED_KEY, btoa(String.fromCharCode(...new Uint8Array(passwordHash))))
    }
    
    return embeddedWallet
  } catch (error) {
    throw new Error('Chave privada inválida')
  }
}

/**
 * Carregar wallet salva (sem descriptografar)
 */
export function loadEmbeddedWallet(): EmbeddedWallet | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    return JSON.parse(stored) as EmbeddedWallet
  } catch {
    return null
  }
}

/**
 * Desbloquear wallet com senha e retornar chave privada descriptografada
 */
export async function unlockEmbeddedWallet(password: string): Promise<string> {
  const wallet = loadEmbeddedWallet()
  if (!wallet || !wallet.encrypted) {
    throw new Error('Wallet não encontrada ou não criptografada')
  }
  
  return await decryptPrivateKey(wallet.privateKey, password)
}

/**
 * Remover wallet salva
 */
export function removeEmbeddedWallet(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Criar provider ethers.js a partir da wallet embutida
 */
export function createEmbeddedProvider(rpcUrl: string): ethers.JsonRpcProvider | null {
  const wallet = loadEmbeddedWallet()
  if (!wallet) return null
  
  try {
    return new ethers.JsonRpcProvider(rpcUrl)
  } catch {
    return null
  }
}

/**
 * Criar wallet ethers.js a partir da wallet embutida
 */
export function createEmbeddedWalletInstance(rpcUrl?: string): ethers.Wallet | null {
  const wallet = loadEmbeddedWallet()
  if (!wallet) return null
  
  try {
    const provider = rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : undefined
    return new ethers.Wallet(wallet.privateKey, provider)
  } catch {
    return null
  }
}

/**
 * Injetar provider no window.ethereum para compatibilidade com wagmi
 */
export async function injectEmbeddedProvider(rpcUrl: string = 'http://localhost:8545', password?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  const wallet = loadEmbeddedWallet()
  if (!wallet) return false
  
  try {
    // Descriptografar chave privada se necessário
    let privateKey: string
    if (wallet.encrypted) {
      if (!password) {
        password = await requestPassword('unlock')
      }
      privateKey = await unlockEmbeddedWallet(password)
    } else {
      privateKey = wallet.privateKey
    }
    
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const walletInstance = new ethers.Wallet(privateKey, provider)
    
    // Criar um objeto que simula window.ethereum
    const ethereumProvider = {
      isMetaMask: false,
      isEmbedded: true,
      selectedAddress: wallet.address,
      
      request: async (args: { method: string; params?: any[] }) => {
        console.log('🔌 Embedded wallet request:', args.method, args.params)
        
        switch (args.method) {
          case 'eth_requestAccounts':
            return [wallet.address]
          
          case 'eth_accounts':
            return [wallet.address]
          
          case 'eth_chainId':
            return '0x539' // 1337 em hex (Hardhat local)
          
          case 'eth_sendTransaction':
            if (!args.params || !args.params[0]) {
              throw new Error('Parâmetros inválidos')
            }
            const tx = await walletInstance.sendTransaction(args.params[0])
            return tx.hash
          
          case 'personal_sign':
            // personal_sign: [message, address]
            if (!args.params || args.params.length < 2) {
              throw new Error('Parâmetros inválidos')
            }
            const message = args.params[0]
            const address = args.params[1]
            
            if (address.toLowerCase() !== wallet.address.toLowerCase()) {
              throw new Error('Endereço não corresponde à wallet')
            }
            
            // Converter mensagem para string se necessário
            let messageToSign: string = message
            if (typeof message === 'string' && message.startsWith('0x')) {
              try {
                messageToSign = ethers.toUtf8String(message)
              } catch {
                messageToSign = message
              }
            }
            return await walletInstance.signMessage(messageToSign)
          
          case 'eth_sign':
            // eth_sign: [address, messageHash] - não suportado, usar personal_sign
            throw new Error('eth_sign não suportado. Use personal_sign.')
          
          case 'eth_getBalance':
            if (!args.params || !args.params[0]) {
              throw new Error('Parâmetros inválidos')
            }
            const balance = await provider.getBalance(args.params[0])
            return '0x' + balance.toString(16)
          
          default:
            throw new Error(`Método não suportado: ${args.method}`)
        }
      },
      
      on: () => {},
      removeListener: () => {},
      isConnected: () => true,
    }
    
    // Injetar no window.ethereum
    ;(window as any).ethereum = ethereumProvider
    
    // Disparar evento para notificar que ethereum está disponível
    window.dispatchEvent(new Event('ethereum#initialized'))
    
    console.log('✅ Embedded wallet injetada:', wallet.address)
    return true
  } catch (error) {
    console.error('❌ Erro ao injetar embedded wallet:', error)
    return false
  }
}

