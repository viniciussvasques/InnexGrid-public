# Plano de Desenvolvimento - Aplicação Desktop InnexGrid

## Visão Geral

Transformar o frontend Next.js em uma aplicação desktop cross-platform usando **Electron**, mantendo 100% do código React existente.

---

## 🎯 Objetivos da Aplicação Desktop

### **Funcionalidades Extras vs Web**

1. **Monitoring em Background**
   - App roda minimizado na bandeja do sistema
   - Monitora recursos do PC em tempo real (CPU, RAM, disco, rede)
   - Atualiza capacidade disponível automaticamente no smart contract

2. **Notificações Nativas**
   - "Você ganhou 50 INGRID!" quando recompensa é distribuída
   - "Nova reserva: 100 unidades de storage" quando consumidor reservar
   - Alertas de capacidade esgotada

3. **Sincronização Offline**
   - Cache local de dados (SQLite ou IndexedDB)
   - Fila de transações pendentes quando offline
   - Sincroniza automaticamente ao reconectar

4. **Integração OS Nativa**
   - Auto-start ao ligar o PC (opcional)
   - Ícone na bandeja com status (ativo/inativo)
   - Menu de contexto rápido

5. **Segurança Aprimorada**
   - Armazenamento seguro de chaves (Electron Safe Storage)
   - Integração com MetaMask desktop
   - Criptografia local de dados sensíveis

---

## 🏗️ Arquitetura Proposta

```
innexgrid-desktop/
├── electron/
│   ├── main.js              # Processo principal (Node.js)
│   ├── preload.js           # Script de preload (ponte segura)
│   ├── monitoring.js        # Monitoramento de recursos do PC
│   ├── notifications.js     # Sistema de notificações
│   └── blockchain-sync.js   # Sincronização com blockchain
├── frontend/                # Código React/Next.js existente
│   ├── app/
│   ├── components/
│   └── ... (reaproveitado 100%)
├── package.json
└── electron-builder.yml     # Configuração de build
```

---

## 📦 Stack Tecnológico

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| **Framework Desktop** | Electron 28+ | Reusa Next.js; cross-platform; maduro |
| **UI** | React 18 + Next.js 14 | Já implementado |
| **Blockchain** | ethers.js | Já implementado |
| **Banco Local** | SQLite3 (better-sqlite3) | Rápido; zero config; SQL completo |
| **Monitoring** | systeminformation | CPU/RAM/disco em tempo real |
| **Notificações** | electron-notifier | Nativas Win/Mac/Linux |
| **Auto-update** | electron-updater | Updates automáticos |
| **Build** | electron-builder | Gera instaladores Win/Mac/Linux |

---

## 🚀 Fases de Desenvolvimento

### **Fase 1: Setup Electron** (2-3 dias)

**Tarefas**:
1. Criar branch `feature/desktop-app`
2. Instalar dependências:
   ```bash
   npm install --save-dev electron electron-builder
   npm install systeminformation better-sqlite3
   ```
3. Configurar `electron/main.js`:
   - Criar janela principal (BrowserWindow)
   - Carregar Next.js em `http://localhost:3000` (dev) ou build estático (prod)
   - Configurar tray icon (ícone na bandeja)
4. Configurar `electron/preload.js`:
   - Expor APIs seguras via `contextBridge`
5. Criar scripts de build:
   ```json
   {
     "scripts": {
       "dev:electron": "concurrently \"npm run dev\" \"electron .\"",
       "build:electron": "next build && electron-builder"
     }
   }
   ```

**Entregável**: App desktop abre e carrega frontend Next.js existente.

---

### **Fase 2: Monitoring de Recursos** (3-4 dias)

**Tarefas**:
1. Criar `electron/monitoring.js`:
   ```javascript
   const si = require('systeminformation');
   
   async function getSystemResources() {
     const cpu = await si.cpu();
     const mem = await si.mem();
     const disk = await si.diskLayout();
     const net = await si.networkStats();
     
     return {
       compute: cpu.cores,           // Núcleos disponíveis
       storage: disk[0].size / 1e9,  // GB
       bandwidth: net[0].rx_sec,     // Mbps
     };
   }
   ```
2. Criar job periódico (a cada 5 min):
   ```javascript
   setInterval(async () => {
     const resources = await getSystemResources();
     // Enviar para backend → blockchain
     updateProviderCapacity(resources);
   }, 5 * 60 * 1000);
   ```
3. UI: Dashboard desktop com gráficos de uso em tempo real

**Entregável**: App monitora recursos e atualiza capacidade automaticamente.

---

### **Fase 3: Notificações** (2 dias)

**Tarefas**:
1. Criar `electron/notifications.js`:
   ```javascript
   const { Notification } = require('electron');
   
   function showNotification(title, body) {
     new Notification({ title, body, icon: 'icon.png' }).show();
   }
   ```
2. Integrar com eventos blockchain:
   - Escutar `RewardDistributed` → notificar ganho
   - Escutar `ProviderReserved` → notificar reserva
3. UI: Configurações para ativar/desativar notificações

**Entregável**: Notificações desktop funcionando.

---

### **Fase 4: Sincronização Offline** (3-4 dias)

**Tarefas**:
1. Criar banco SQLite local:
   ```sql
   CREATE TABLE pending_transactions (
     id INTEGER PRIMARY KEY,
     type TEXT,
     payload TEXT,
     created_at DATETIME,
     status TEXT
   );
   ```
2. Criar fila de transações:
   - Offline: salva no SQLite
   - Online: processa fila → blockchain
3. UI: Indicador de status (online/offline/syncing)

**Entregável**: App funciona offline; sincroniza ao reconectar.

---

### **Fase 5: Instaladores** (2 dias)

**Tarefas**:
1. Configurar `electron-builder.yml`:
   ```yaml
   appId: com.innexar.innexgrid
   productName: InnexGrid
   directories:
     output: dist
   win:
     target: nsis
   mac:
     target: dmg
   linux:
     target: AppImage
   ```
2. Criar instaladores para:
   - **Windows**: `.exe` (NSIS)
   - **macOS**: `.dmg`
   - **Linux**: `.AppImage`
3. Testar instalação em cada OS

**Entregável**: Instaladores funcionais para Win/Mac/Linux.

---

### **Fase 6: Auto-update** (1-2 dias)

**Tarefas**:
1. Configurar `electron-updater`:
   ```javascript
   const { autoUpdater } = require('electron-updater');
   
   autoUpdater.checkForUpdatesAndNotify();
   ```
2. Hospedar releases no GitHub Releases
3. Testar update automático

**Entregável**: App verifica e instala updates automaticamente.

---

## 📋 Cronograma Estimado

| Fase | Duração | Acumulado |
|------|---------|-----------|
| 1. Setup Electron | 2-3 dias | 3 dias |
| 2. Monitoring | 3-4 dias | 7 dias |
| 3. Notificações | 2 dias | 9 dias |
| 4. Sincronização Offline | 3-4 dias | 13 dias |
| 5. Instaladores | 2 dias | 15 dias |
| 6. Auto-update | 1-2 dias | 17 dias |
| **Buffer/Testes** | 3 dias | **20 dias** |

**Total**: ~3-4 semanas de desenvolvimento.

---

## 🎨 Mockups Desktop

### **Tray Icon Menu**
```
[🟢 InnexGrid - Ativo]
─────────────────────
Dashboard
Configurações
─────────────────────
Status: Online
Recursos: 45% em uso
Ganhos hoje: 12.5 INGRID
─────────────────────
Sair
```

### **Dashboard Desktop**
```
┌─────────────────────────────────────────────┐
│ InnexGrid Desktop                     [−][□][×] │
├─────────────────────────────────────────────┤
│  Provider: 0x995...836a                      │
│  Status: 🟢 Ativo                             │
├─────────────────────────────────────────────┤
│  Recursos Monitorados:                       │
│  ├─ CPU: 64 cores (28 disponíveis) ████░░░░  │
│  ├─ RAM: 64GB (32GB livres)        ████████  │
│  ├─ Storage: 2TB (1.2TB livres)    ████░░░░  │
│  └─ Rede: 1Gbps (800Mbps livres)  ████████  │
├─────────────────────────────────────────────┤
│  Ganhos (últimas 24h):                       │
│  💰 125.50 INGRID (+12.3%)                   │
├─────────────────────────────────────────────┤
│  [Distribuir Recompensas] [Configurações]   │
└─────────────────────────────────────────────┘
```

---

## 🔒 Segurança Desktop

### **Electron Safe Storage**
```javascript
const { safeStorage } = require('electron');

// Criptografar private key
const encrypted = safeStorage.encryptString(privateKey);
localStorage.setItem('pk', encrypted.toString('base64'));

// Descriptografar
const buffer = Buffer.from(localStorage.getItem('pk'), 'base64');
const decrypted = safeStorage.decryptString(buffer);
```

### **CSP (Content Security Policy)**
```javascript
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:3001 http://localhost:8545"
      ]
    }
  });
});
```

---

## 📊 Comparação Web vs Desktop

| Feature | Web | Desktop |
|---------|-----|---------|
| Acesso | Navegador | Instalado no OS |
| Monitoring | Manual | Automático (background) |
| Notificações | Browser (limitado) | Nativas (ricas) |
| Offline | Não | Sim (com sync) |
| Auto-update | Refresh | Automático |
| Tamanho | N/A | ~100MB (Electron) |
| Performance | Depende do browser | Otimizado |

---

## ✅ Checklist Pré-desenvolvimento

Antes de começar:
- [ ] Frontend web 100% funcional e testado
- [ ] Backend com todas APIs prontas
- [ ] Contratos deployados e auditados
- [ ] Documentação de APIs completa
- [ ] Decisão: Electron ou Tauri?
- [ ] Design de ícones/logo desktop
- [ ] Plano de distribuição (GitHub Releases, website, etc.)

---

**Próximo Passo**: Iniciar Fase 1 - Setup Electron
**Comando para começar**:
```bash
cd C:\web3
git checkout -b feature/desktop-app
npm install --save-dev electron electron-builder concurrently
mkdir electron
```

**Contato para dúvidas**: Pronto para partir! 🚀
