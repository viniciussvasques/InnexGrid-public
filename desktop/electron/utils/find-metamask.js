/**
 * Utilitário para encontrar MetaMask instalado no sistema
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Encontrar caminho do MetaMask baseado no OS
 * Verifica múltiplos perfis do Chrome
 */
function findMetaMaskPath() {
  const platform = os.platform();
  const extensionId = 'nkbihfbeogaeaoehlefnkodbefgpgknn';
  let basePaths = [];
  
  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
    const chromeUserData = path.join(localAppData, 'Google', 'Chrome', 'User Data');
    
    // Verificar perfis comuns
    basePaths = [
      path.join(chromeUserData, 'Default', 'Extensions', extensionId),
      path.join(chromeUserData, 'Profile 1', 'Extensions', extensionId),
      path.join(chromeUserData, 'Profile 2', 'Extensions', extensionId),
    ];
    
    // Tentar encontrar todos os perfis
    try {
      const profilesPath = path.join(chromeUserData);
      if (fs.existsSync(profilesPath)) {
        const items = fs.readdirSync(profilesPath);
        items.forEach(item => {
          if (item.startsWith('Profile ') || item === 'Default') {
            const profileExtPath = path.join(profilesPath, item, 'Extensions', extensionId);
            if (fs.existsSync(profileExtPath) && !basePaths.includes(profileExtPath)) {
              basePaths.push(profileExtPath);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Erro ao buscar perfis do Chrome:', error.message);
    }
  } else if (platform === 'darwin') {
    const homeDir = os.homedir();
    const chromeUserData = path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome');
    
    basePaths = [
      path.join(chromeUserData, 'Default', 'Extensions', extensionId),
      path.join(chromeUserData, 'Profile 1', 'Extensions', extensionId),
    ];
  } else if (platform === 'linux') {
    const homeDir = os.homedir();
    const chromeUserData = path.join(homeDir, '.config', 'google-chrome');
    
    basePaths = [
      path.join(chromeUserData, 'Default', 'Extensions', extensionId),
      path.join(chromeUserData, 'Profile 1', 'Extensions', extensionId),
    ];
  }
  
  // Tentar cada caminho
  for (const basePath of basePaths) {
    if (basePath && fs.existsSync(basePath)) {
      // Encontrar versão mais recente
      try {
        const versions = fs.readdirSync(basePath)
          .filter(v => {
            const versionPath = path.join(basePath, v);
            return fs.statSync(versionPath).isDirectory();
          })
          .sort()
          .reverse();
        
        if (versions.length > 0) {
          const fullPath = path.join(basePath, versions[0]);
          console.log(`✅ MetaMask encontrado em: ${fullPath}`);
          return fullPath;
        }
      } catch (error) {
        console.warn(`Erro ao ler versões do MetaMask em ${basePath}:`, error.message);
        continue;
      }
    }
  }
  
  console.warn('⚠️ MetaMask não encontrado em nenhum perfil do Chrome');
  return null;
}

/**
 * Verificar se MetaMask está instalado
 */
function isMetaMaskInstalled() {
  return findMetaMaskPath() !== null;
}

module.exports = {
  findMetaMaskPath,
  isMetaMaskInstalled
};

