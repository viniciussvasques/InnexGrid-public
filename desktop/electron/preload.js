/**
 * InnexGrid Desktop App - Preload Script
 * 
 * Ponte segura entre Main Process e Renderer Process
 * Expõe APIs do Electron para o frontend React de forma segura
 */

const { contextBridge } = require('electron');

// Detectar se está em desenvolvimento
// No preload, não temos acesso direto ao app, então usamos apenas NODE_ENV
const isDev = process.env.NODE_ENV === 'development';

const { ipcRenderer } = require('electron');

/**
 * Expor APIs seguras para o renderer (frontend React)
 * 
 * IMPORTANTE: Apenas APIs necessárias devem ser expostas aqui
 * para manter segurança (context isolation)
 */
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Informações da plataforma
    platform: process.platform, // 'win32', 'darwin', 'linux'
    isDev: isDev,
    
    // Versão do Electron
    getVersion: () => process.versions.electron,
    
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // MetaMask helpers
  checkMetaMaskInstalled: () => ipcRenderer.invoke('check-metamask-installed'),
  getMetaMaskPath: () => ipcRenderer.invoke('get-metamask-path'),
  reloadExtensions: () => ipcRenderer.invoke('reload-extensions'),
  
  // System Resources
  getSystemResources: () => ipcRenderer.invoke('get-system-resources'),
  
  // Gateway Integration
  gateway: {
    registerProvider: (providerAddress, localPort) => 
      ipcRenderer.invoke('gateway-register-provider', providerAddress, localPort),
    disconnectProvider: () => 
      ipcRenderer.invoke('gateway-disconnect-provider'),
    getStatus: () => 
      ipcRenderer.invoke('gateway-get-status'),
    checkHealth: () => 
      ipcRenderer.invoke('gateway-check-health'),
  },
  
  // Resource Server
  resourceServer: {
    start: (port) => 
      ipcRenderer.invoke('resource-server-start', port),
    stop: () => 
      ipcRenderer.invoke('resource-server-stop'),
    getStatus: () => 
      ipcRenderer.invoke('resource-server-status'),
    registerResources: (resources) => 
      ipcRenderer.invoke('resource-server-register', resources),
  },
  
  // Placeholder para funcionalidades futuras
    // Estas serão implementadas nas próximas fases:
    // - getMonitoringStatus() - Fase 2
    // - toggleMonitoring() - Fase 2
    // - showNotification() - Fase 3 (Notificações)
  });
} catch (error) {
  console.error('Error exposing electronAPI:', error);
}

// Log para debug
if (isDev) {
  console.log('✅ Electron preload script loaded successfully');
  console.log('Platform:', process.platform);
  console.log('Electron version:', process.versions.electron);
}

