/**
 * IPC Handlers adicionais para comunicação com frontend
 */

const { ipcMain } = require('electron');
const { isMetaMaskInstalled, findMetaMaskPath } = require('./utils/find-metamask');
const { getSystemResources } = require('./utils/system-resources');
const { gatewayIntegration } = require('./services/gateway-integration');
const { resourceServer } = require('./services/resource-server');

/**
 * Registrar handlers IPC
 */
function registerIpcHandlers() {
  // Verificar se MetaMask está instalado
  ipcMain.handle('check-metamask-installed', () => {
    return isMetaMaskInstalled();
  });

  // Obter caminho do MetaMask
  ipcMain.handle('get-metamask-path', () => {
    return findMetaMaskPath();
  });

  // Recarregar extensões
  ipcMain.handle('reload-extensions', async (event) => {
    const { BrowserWindow } = require('electron');
    const mainWindow = BrowserWindow.fromWebContents(event.sender);
    
    if (mainWindow) {
      try {
        const metamaskPath = findMetaMaskPath();
        if (metamaskPath) {
          await mainWindow.webContents.session.loadExtension(metamaskPath);
          return { success: true, message: 'MetaMask recarregado com sucesso' };
        }
        return { success: false, message: 'MetaMask não encontrado' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
    
    return { success: false, message: 'Janela não encontrada' };
  });

  // Obter recursos do sistema
  ipcMain.handle('get-system-resources', async () => {
    console.log('📡 IPC: get-system-resources chamado');
    try {
      console.log('🔍 IPC: Chamando getSystemResources()...');
      const resources = await getSystemResources();
      console.log('✅ IPC: Recursos obtidos:', JSON.stringify(resources, null, 2));
      return { success: true, data: resources };
    } catch (error) {
      console.error('❌ IPC: Erro ao obter recursos do sistema:', error);
      console.error('❌ IPC: Stack trace:', error.stack);
      return { success: false, error: error.message || 'Erro desconhecido' };
    }
  });

  // Gateway Integration Handlers
  // Registrar provider no Gateway
  ipcMain.handle('gateway-register-provider', async (event, providerAddress, localPort) => {
    try {
      const result = await gatewayIntegration.registerProvider(providerAddress, localPort);
      return result;
    } catch (error) {
      console.error('❌ IPC: Erro ao registrar provider no Gateway:', error);
      return { success: false, error: error.message };
    }
  });

  // Desconectar provider do Gateway
  ipcMain.handle('gateway-disconnect-provider', async () => {
    try {
      const result = await gatewayIntegration.disconnectProvider();
      return result;
    } catch (error) {
      console.error('❌ IPC: Erro ao desconectar provider:', error);
      return { success: false, error: error.message };
    }
  });

  // Obter status do Gateway
  ipcMain.handle('gateway-get-status', async () => {
    try {
      const status = gatewayIntegration.getStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error('❌ IPC: Erro ao obter status do Gateway:', error);
      return { success: false, error: error.message };
    }
  });

  // Verificar saúde do Gateway
  ipcMain.handle('gateway-check-health', async () => {
    try {
      const health = await gatewayIntegration.checkGatewayHealth();
      return { success: true, data: health };
    } catch (error) {
      console.error('❌ IPC: Erro ao verificar saúde do Gateway:', error);
      return { success: false, error: error.message };
    }
  });

  // Resource Server Handlers
  // Iniciar servidor de recursos
  ipcMain.handle('resource-server-start', async (event, port) => {
    try {
      const result = await resourceServer.start(port);
      return result;
    } catch (error) {
      console.error('❌ IPC: Erro ao iniciar resource server:', error);
      return { success: false, error: error.message };
    }
  });

  // Parar servidor de recursos
  ipcMain.handle('resource-server-stop', async () => {
    try {
      const result = await resourceServer.stop();
      return result;
    } catch (error) {
      console.error('❌ IPC: Erro ao parar resource server:', error);
      return { success: false, error: error.message };
    }
  });

  // Obter status do resource server
  ipcMain.handle('resource-server-status', async () => {
    try {
      const status = resourceServer.getStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error('❌ IPC: Erro ao obter status do resource server:', error);
      return { success: false, error: error.message };
    }
  });

  // Registrar recursos no servidor
  ipcMain.handle('resource-server-register', async (event, resources) => {
    try {
      resourceServer.registerResources(resources);
      return { success: true };
    } catch (error) {
      console.error('❌ IPC: Erro ao registrar recursos:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerIpcHandlers
};

