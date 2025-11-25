# 🏗️ Design da Solução - InnexGrid Desktop App

## 📐 Arquitetura

### Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  main.js     │  │ monitoring.js│  │notifications│     │
│  │  - Window    │  │  - Resources │  │  - Native    │     │
│  │  - Tray      │  │  - Sync      │  │  - Events    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                   │
│                    ┌──────▼───────┐                          │
│                    │  IPC Bridge  │                          │
│                    │  (preload.js)│                          │
│                    └──────┬───────┘                          │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ contextBridge
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Electron Renderer Process                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Next.js Frontend (React)                     │  │
│  │  - Provider Dashboard                                 │  │
│  │  - Consumer Dashboard                                 │  │
│  │  - Marketplace                                        │  │
│  │  - Mesmos componentes e hooks                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Electron API (window.electronAPI)            │  │
│  │  - getSystemResources()                              │  │
│  │  - getMonitoringStatus()                             │  │
│  │  - toggleMonitoring()                                │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  - REST Endpoints                                            │
│  - Blockchain Integration                                    │
│  - Database (PostgreSQL)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Integração com Aplicação Web

### Estratégia de Reutilização

#### 1. **Frontend Next.js**

**Abordagem**: Carregar Next.js dentro do Electron BrowserWindow

```javascript
// electron/main.js
const FRONTEND_URL = isDev 
  ? 'http://localhost:3000'  // Dev: Next.js dev server
  : `file://${path.join(__dirname, '../../frontend/.next')}/index.html`; // Prod: Build estático

mainWindow.loadURL(FRONTEND_URL);
```

**Vantagens**:
- ✅ 100% reutilização de código
- ✅ Mesmos componentes React
- ✅ Mesmos hooks e lógica
- ✅ Hot reload em desenvolvimento

#### 2. **APIs e Backend**

**Abordagem**: Mesmo backend, mesmas APIs

```typescript
// frontend/config/api.ts (já existe)
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  // ... mesmo código funciona no desktop
};
```

**Vantagens**:
- ✅ Mesmos endpoints REST
- ✅ Mesma autenticação JWT
- ✅ Mesma integração blockchain
- ✅ Zero mudanças no backend

#### 3. **Estado e Autenticação**

**Abordagem**: Compartilhar estado via backend

```typescript
// frontend/app/hooks/useAuth.ts (já existe)
// Funciona igual no desktop e web
export const useAuth = () => {
  // ... mesmo código
};
```

**Vantagens**:
- ✅ Mesmo sistema de auth
- ✅ Mesmas configurações
- ✅ Sincronização automática

---

## 📡 Endpoints e Fluxos

### Fluxo 1: Inicialização do App

```
1. Electron main.js inicia
2. Carrega Next.js (localhost:3000 ou build)
3. Next.js carrega normalmente
4. Frontend detecta Electron (window.electronAPI)
5. Habilita funcionalidades desktop
```

### Fluxo 2: Monitoring de Recursos

```
1. Electron monitoring.js coleta recursos (CPU, RAM, etc.)
2. A cada 5 minutos, envia para backend
3. Backend atualiza provider_resources
4. Frontend (Next.js) recebe atualização via polling/websocket
5. UI atualiza automaticamente
```

### Fluxo 3: Notificações

```
1. Backend detecta evento (recompensa, reserva, etc.)
2. Envia notificação via WebSocket ou polling
3. Electron notifications.js recebe
4. Mostra notificação nativa
5. Usuário clica → abre app
```

### Fluxo 4: Autenticação

```
1. Usuário conecta wallet (MetaMask)
2. Frontend (Next.js) faz login via backend
3. Backend retorna JWT
4. Frontend armazena JWT (localStorage)
5. Mesmo fluxo funciona no desktop e web
```

---

## 🔐 Segurança

### Context Isolation

```javascript
// electron/preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  // Apenas APIs necessárias expostas
  getSystemResources: () => ipcRenderer.invoke('get-system-resources'),
  // ...
});
```

### Content Security Policy

```javascript
// electron/main.js
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; " +
        "connect-src 'self' http://localhost:3001 https://*.infura.io"
      ]
    }
  });
});
```

---

## 📦 Estrutura de Arquivos

```
desktop/
├── electron/
│   ├── main.js              # Processo principal
│   ├── preload.js           # Ponte segura (contextBridge)
│   ├── monitoring.js         # Monitoramento de recursos
│   ├── notifications.js     # Notificações nativas
│   └── blockchain-sync.js   # Sincronização (futuro)
├── assets/
│   ├── icon.png            # Ícone Linux
│   ├── icon.ico            # Ícone Windows
│   ├── icon.icns           # Ícone macOS
│   └── tray-icon.png       # Ícone tray
├── package.json
├── electron-builder.yml     # Config build
└── README.md
```

---

## 🔄 Fluxos de Dados

### 1. Monitoring → Backend

```typescript
// electron/monitoring.js
async function syncResourcesToBackend() {
  const resources = await getSystemResources();
  
  await fetch('http://localhost:3001/api/providers/:address/resources', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'x-wallet-address': walletAddress
    },
    body: JSON.stringify({
      compute: resources.compute.cores,
      storage: resources.storage.available,
      // ...
    })
  });
}
```

### 2. Backend → Notificações

```typescript
// Opção 1: Polling (simples)
setInterval(async () => {
  const events = await fetch('/api/notifications');
  events.forEach(event => {
    window.electronAPI?.showNotification(event.title, event.body);
  });
}, 30000); // 30 segundos

// Opção 2: WebSocket (futuro)
const ws = new WebSocket('ws://localhost:3001/notifications');
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  window.electronAPI?.showNotification(notification.title, notification.body);
};
```

---

## 🧪 Estratégia de Testes

### Testes Unitários

```javascript
// electron/__tests__/monitoring.test.js
describe('Monitoring', () => {
  it('should get system resources', async () => {
    const resources = await monitoring.getSystemResources();
    expect(resources).toHaveProperty('compute');
    expect(resources).toHaveProperty('memory');
  });
});
```

### Testes de Integração

```javascript
// electron/__tests__/integration.test.js
describe('Electron + Next.js Integration', () => {
  it('should load Next.js in BrowserWindow', async () => {
    // Testar se Next.js carrega
  });
  
  it('should expose electronAPI to renderer', () => {
    // Testar se window.electronAPI existe
  });
});
```

### Testes E2E

```javascript
// e2e/desktop.test.js
describe('Desktop App E2E', () => {
  it('should open app and load dashboard', async () => {
    // Testar fluxo completo
  });
});
```

---

## 📊 Diagrama de Sequência

### Monitoring de Recursos

```
Electron Main    Monitoring    Backend API    Frontend
     │               │              │             │
     │──start()──────>│              │             │
     │               │              │             │
     │               │──getResources()            │
     │               │<─resources───│             │
     │               │              │             │
     │               │──PUT /resources───────────>│
     │               │              │             │
     │               │              │──200 OK────>│
     │               │              │             │
     │               │              │             │──update UI
```

---

## ✅ Checklist de Design

- [x] Arquitetura definida
- [x] Integração com web garantida
- [x] Fluxos documentados
- [x] Segurança considerada
- [x] Estrutura de arquivos definida
- [x] Estratégia de testes definida
- [ ] Diagramas completos
- [ ] Especificações técnicas detalhadas

---

## 🚀 Próximo Passo

**Criar ambiente + setup inicial** - Configurar ambiente de desenvolvimento e estrutura básica.

