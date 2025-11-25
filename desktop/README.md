# 🖥️ InnexGrid Desktop Application

Aplicação desktop cross-platform para InnexGrid usando Electron.

## 🚀 Início Rápido

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento (Next.js + Electron)
npm run dev
```

### Build

```bash
# Build para produção
npm run build

# Os instaladores estarão em desktop/dist/
```

## 📦 Estrutura

```
desktop/
├── electron/
│   ├── main.js           # Processo principal
│   ├── preload.js        # Script de preload (ponte segura)
│   ├── monitoring.js     # Monitoramento de recursos
│   └── notifications.js  # Sistema de notificações
├── assets/               # Ícones e recursos
└── package.json
```

## 🔧 Funcionalidades

- ✅ Integração com frontend Next.js
- ✅ Monitoramento de recursos do PC (CPU, RAM, Storage, Network)
- ✅ Notificações nativas
- ✅ Tray icon com menu
- ✅ Auto-update (em produção)

## 📝 Próximas Funcionalidades

- [ ] Sincronização offline com SQLite
- [ ] Integração com MetaMask desktop
- [ ] Auto-start ao ligar PC
- [ ] Dashboard de recursos em tempo real

