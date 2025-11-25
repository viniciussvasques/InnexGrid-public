/**
 * InnexGrid Desktop App - Main Process
 * 
 * Este é o processo principal do Electron que gerencia:
 * - Criação e gerenciamento de janelas
 * - Integração com sistema operacional
 * - Comunicação com processos renderer
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { findMetaMaskPath, isMetaMaskInstalled } = require('./utils/find-metamask');
const { registerIpcHandlers } = require('./ipc-handlers');

// Detectar se está em desenvolvimento
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// URL do frontend Next.js
const FRONTEND_URL = isDev 
  ? 'http://localhost:3000' 
  : `file://${path.join(__dirname, '../../frontend/.next')}/index.html`;

let mainWindow = null;
let tray = null;
let isQuitting = false;

/**
 * Criar janela principal
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      // Permitir acesso a window.ethereum para MetaMask
      allowRunningInsecureContent: false
    },
    show: false, // Não mostrar até carregar completamente
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Carregar frontend Next.js
  mainWindow.loadURL(FRONTEND_URL);

  // Mostrar quando pronto
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Abrir DevTools em desenvolvimento
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Fechar janela (minimizar para tray em vez de fechar)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // macOS: Esconder dock icon
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });

  // Quando janela é fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Log de erros de carregamento
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (isDev) {
      console.log('Make sure Next.js is running on http://localhost:3000');
    }
  });

  // Configurar Content Security Policy
  // Em desenvolvimento, usar CSP mais permissiva mas ainda segura
  // Em produção, usar CSP mais restritiva
  // Nota: 'unsafe-eval' é necessário para Next.js hot reload em desenvolvimento
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? [
          // CSP para desenvolvimento (permite hot reload e dev tools)
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000 http://localhost:3001 http://localhost:* ws://localhost:* https://fonts.googleapis.com; " +
          "style-src 'self' 'unsafe-inline' http://localhost:3000 http://localhost:3001 https://fonts.googleapis.com; " +
          "style-src-elem 'self' 'unsafe-inline' http://localhost:3000 http://localhost:3001 https://fonts.googleapis.com; " +
          "img-src 'self' data: https: http://localhost:3000 http://localhost:3001; " +
          "font-src 'self' data: http://localhost:3000 http://localhost:3001 https://fonts.gstatic.com; " +
          "connect-src 'self' http://localhost:* https://* ws://localhost:* wss://*; " +
          "frame-src 'self' http://localhost:* https://*; " +
          "worker-src 'self' blob:; " +
          "child-src 'self' blob:;"
        ]
      : [
          // CSP para produção (mais restritiva)
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data: https://fonts.gstatic.com; " +
          "connect-src 'self' https://* wss://*; " +
          "frame-src 'self'; " +
          "worker-src 'self' blob:; " +
          "child-src 'self' blob:;"
        ];

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': csp
      }
    });
  });
}

/**
 * Criar tray icon (ícone na bandeja do sistema)
 */
function createTray() {
  // Tentar carregar ícone (se não existir, criar placeholder)
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  let icon = nativeImage.createFromPath(iconPath);
  
  // Se ícone não existir, criar um temporário
  if (icon.isEmpty() || !icon) {
    // Criar ícone simples programaticamente (16x16 pixels)
    icon = nativeImage.createEmpty();
  }
  
  tray = new Tray(icon);
  tray.setToolTip('InnexGrid Desktop');

  // Menu do tray
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🟢 InnexGrid',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Abrir Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Sair',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Clique duplo no tray abre janela
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

/**
 * Carregar extensões do Chrome (incluindo MetaMask)
 * 
 * O Electron pode carregar extensões do Chrome instaladas no sistema.
 * Isso permite usar MetaMask diretamente no app desktop.
 */
async function loadExtensions() {
  if (!mainWindow) {
    console.warn('⚠️ Janela não criada ainda, não é possível carregar extensões');
    return false;
  }

  try {
    console.log('🔍 Verificando MetaMask...');
    
    // Verificar se MetaMask está instalado
    const isInstalled = isMetaMaskInstalled();
    console.log('📋 MetaMask instalado:', isInstalled);
    
    if (!isInstalled) {
      console.log('⚠️ MetaMask não encontrado no Chrome.');
      console.log('   Instale MetaMask no Chrome primeiro: https://metamask.io/download/');
      return false;
    }
    
    // Encontrar caminho do MetaMask
    const metamaskPath = findMetaMaskPath();
    console.log('📁 Caminho do MetaMask:', metamaskPath);
    
    if (!metamaskPath) {
      console.warn('⚠️ Caminho do MetaMask não encontrado');
      return false;
    }
    
    if (!fs.existsSync(metamaskPath)) {
      console.warn('⚠️ Caminho do MetaMask não existe:', metamaskPath);
      return false;
    }
    
    console.log('📦 MetaMask encontrado, carregando extensão...');
    console.log('   Caminho completo:', metamaskPath);
    
    try {
      const extension = await mainWindow.webContents.session.loadExtension(metamaskPath);
      console.log('✅ MetaMask carregado com sucesso!');
      console.log('   ID da extensão:', extension.id);
      console.log('   Nome:', extension.name);
      console.log('   Versão:', extension.version);
      
      // Verificar extensões carregadas
      const loadedExtensions = mainWindow.webContents.session.getAllExtensions();
      console.log('📋 Extensões carregadas:', loadedExtensions.map(ext => ({
        id: ext.id,
        name: ext.name
      })));
      
      return true;
    } catch (loadError) {
      console.error('❌ Erro ao carregar MetaMask:');
      console.error('   Mensagem:', loadError.message);
      console.error('   Stack:', loadError.stack);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao procurar MetaMask:');
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

// Quando app está pronto
app.whenReady().then(async () => {
  createWindow();
  createTray();
  
  // Carregar MetaMask após janela estar pronta
  // Aguardar um pouco para garantir que a sessão está pronta
  mainWindow.webContents.once('did-finish-load', async () => {
    console.log('📄 Página carregada, aguardando para carregar extensões...');
    // Aguardar mais um pouco para garantir que tudo está pronto
    setTimeout(async () => {
      if (mainWindow) {
        console.log('🔄 Iniciando carregamento de extensões...');
        const loaded = await loadExtensions();
        if (loaded) {
          console.log('✅ Extensões carregadas com sucesso');
          // Notificar o frontend que MetaMask foi carregado
          mainWindow.webContents.executeJavaScript(`
            console.log('✅ MetaMask foi carregado no Electron');
            // Disparar evento customizado para notificar o frontend
            window.dispatchEvent(new CustomEvent('metamask-loaded'));
          `);
        } else {
          console.warn('⚠️ Falha ao carregar extensões');
        }
      }
    }, 2000); // 2 segundos após página carregar para dar mais tempo
  });

  // macOS: Reabrir janela quando dock icon é clicado
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

// Quando todas as janelas são fechadas
app.on('window-all-closed', () => {
  // Não fechar app completamente (fica no tray)
  // Apenas fechar se isQuitting for true
  if (isQuitting || process.platform !== 'darwin') {
    // macOS: Manter app rodando mesmo sem janelas (fica no dock)
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});

// Antes de sair
app.on('before-quit', () => {
  isQuitting = true;
});

// IPC Handlers - Comunicação entre processos
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Registrar handlers adicionais
registerIpcHandlers();

// Log de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

