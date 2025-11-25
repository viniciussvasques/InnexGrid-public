/**
 * Utilities para detectar e interagir com Electron
 */

/**
 * Verifica se está rodando dentro do Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

/**
 * Obtém informações da plataforma Electron
 */
export function getElectronPlatform(): string | null {
  if (!isElectron()) return null;
  return window.electronAPI?.platform || null;
}

/**
 * Verifica se está em desenvolvimento
 */
export function isElectronDev(): boolean {
  if (!isElectron()) return false;
  return window.electronAPI?.isDev || false;
}

/**
 * Obtém versão do Electron
 */
export function getElectronVersion(): string | null {
  if (!isElectron()) return null;
  return window.electronAPI?.getVersion() || null;
}

/**
 * Hook React para usar Electron API
 */
export function useElectron() {
  const isElectronApp = isElectron();
  const platform = getElectronPlatform();
  const isDev = isElectronDev();
  const version = getElectronVersion();

  const minimize = () => {
    if (isElectronApp && window.electronAPI?.minimize) {
      window.electronAPI.minimize();
    }
  };

  const maximize = () => {
    if (isElectronApp && window.electronAPI?.maximize) {
      window.electronAPI.maximize();
    }
  };

  const close = () => {
    if (isElectronApp && window.electronAPI?.close) {
      window.electronAPI.close();
    }
  };

  const checkMetaMaskInstalled = async () => {
    if (isElectronApp && window.electronAPI?.checkMetaMaskInstalled) {
      return await window.electronAPI.checkMetaMaskInstalled();
    }
    return false;
  };

  const reloadExtensions = async () => {
    if (isElectronApp && window.electronAPI?.reloadExtensions) {
      return await window.electronAPI.reloadExtensions();
    }
    return { success: false, message: 'Not available' };
  };

  const getSystemResources = async () => {
    if (isElectronApp && window.electronAPI?.getSystemResources) {
      return await window.electronAPI.getSystemResources();
    }
    return { success: false, error: 'Not available' };
  };

  // Gateway Integration
  const gateway = {
    registerProvider: async (providerAddress: string, localPort: number) => {
      if (isElectronApp && window.electronAPI?.gateway?.registerProvider) {
        return await window.electronAPI.gateway.registerProvider(providerAddress, localPort);
      }
      return { success: false, error: 'Not available' };
    },
    disconnectProvider: async () => {
      if (isElectronApp && window.electronAPI?.gateway?.disconnectProvider) {
        return await window.electronAPI.gateway.disconnectProvider();
      }
      return { success: false, error: 'Not available' };
    },
    getStatus: async () => {
      if (isElectronApp && window.electronAPI?.gateway?.getStatus) {
        return await window.electronAPI.gateway.getStatus();
      }
      return { success: false, error: 'Not available' };
    },
    checkHealth: async () => {
      if (isElectronApp && window.electronAPI?.gateway?.checkHealth) {
        return await window.electronAPI.gateway.checkHealth();
      }
      return { success: false, error: 'Not available' };
    },
  };

  // Resource Server
  const resourceServer = {
    start: async (port?: number) => {
      if (isElectronApp && window.electronAPI?.resourceServer?.start) {
        return await window.electronAPI.resourceServer.start(port);
      }
      return { success: false, error: 'Not available' };
    },
    stop: async () => {
      if (isElectronApp && window.electronAPI?.resourceServer?.stop) {
        return await window.electronAPI.resourceServer.stop();
      }
      return { success: false, error: 'Not available' };
    },
    getStatus: async () => {
      if (isElectronApp && window.electronAPI?.resourceServer?.getStatus) {
        return await window.electronAPI.resourceServer.getStatus();
      }
      return { success: false, error: 'Not available' };
    },
    registerResources: async (resources: Record<string, any>) => {
      if (isElectronApp && window.electronAPI?.resourceServer?.registerResources) {
        return await window.electronAPI.resourceServer.registerResources(resources);
      }
      return { success: false, error: 'Not available' };
    },
  };

  return {
    isElectron: isElectronApp,
    platform,
    isDev,
    version,
    minimize,
    maximize,
    close,
    checkMetaMaskInstalled,
    reloadExtensions,
    getSystemResources,
    gateway,
    resourceServer,
  };
}

