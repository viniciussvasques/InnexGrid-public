/**
 * Type definitions for Electron API exposed via preload
 */
export interface ElectronAPI {
  // Platform info
  platform: string;
  isDev: boolean;
  
  // App version
  getVersion: () => string;
  
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  
  // MetaMask helpers
  checkMetaMaskInstalled: () => Promise<boolean>;
  getMetaMaskPath: () => Promise<string | null>;
  reloadExtensions: () => Promise<{ success: boolean; message: string }>;
  
  // System Resources
  getSystemResources: () => Promise<{ success: boolean; data?: SystemResources; error?: string }>;
  
  // Gateway Integration
  gateway: {
    registerProvider: (providerAddress: string, localPort: number) => Promise<{
      success: boolean;
      publicEndpoint?: string;
      connectionToken?: string;
      error?: string;
    }>;
    disconnectProvider: () => Promise<{ success: boolean; error?: string }>;
    getStatus: () => Promise<{
      success: boolean;
      data?: {
        isRegistered: boolean;
        providerAddress: string | null;
        localEndpoint: string | null;
        publicEndpoint: string | null;
        gatewayUrl: string;
      };
      error?: string;
    }>;
    checkHealth: () => Promise<{
      success: boolean;
      data?: {
        available: boolean;
        status?: string;
        database?: string;
        error?: string;
      };
      error?: string;
    }>;
  };
  
  // Resource Server
  resourceServer: {
    start: (port?: number) => Promise<{
      success: boolean;
      port?: number;
      endpoint?: string;
      error?: string;
    }>;
    stop: () => Promise<{ success: boolean; error?: string }>;
    getStatus: () => Promise<{
      success: boolean;
      data?: {
        isRunning: boolean;
        port: number | null;
        endpoint: string | null;
        resources: string[];
      };
      error?: string;
    }>;
    registerResources: (resources: Record<string, any>) => Promise<{
      success: boolean;
      error?: string;
    }>;
  };
  
  // Placeholder para funcionalidades futuras
  // getMonitoringStatus: () => Promise<MonitoringStatus>;
  // toggleMonitoring: (enabled: boolean) => Promise<MonitoringStatus>;
}

export interface SystemResources {
  compute: {
    cores: number;
    physicalCores: number;
    processors: number;
    brand: string;
    speed?: number; // MHz
    usage?: number; // Percentual
  };
  memory: {
    total: number;
    free: number;
    used: number;
    available: number;
    usage?: number; // Percentual
  };
  storage: {
    total: number;
    used: number;
    available: number;
    unit: string;
    usage?: number; // Percentual
  };
  network: {
    speed: number;
    unit: string;
    interfaces: number;
  };
  platform?: string;
  arch?: string;
  hostname?: string;
  timestamp: number;
}

export interface MonitoringStatus {
  isMonitoring: boolean;
  lastUpdate: number | null;
  resources: SystemResources | null;
}

export interface NotificationsAPI {
  show: (title: string, body: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    notifications?: NotificationsAPI;
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

