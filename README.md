# 🚀 InnexGrid - Decentralized Physical Infrastructure Network

## 📋 Visão Geral

**Empresa:** Innexar  
**Plataforma:** InnexGrid

Plataforma DePIN que permite usuários compartilharem recursos físicos (internet, armazenamento, GPU, sensores) e receberem tokens como recompensa, enquanto consumidores pagam para usar esses recursos de forma descentralizada.

## 🏗️ Estrutura do Projeto

```
innexgrid/
├── contracts/          # Smart contracts (Solidity)
├── frontend/          # Next.js frontend
├── backend/           # Node.js API
├── docs/              # Documentação técnica
└── templates/         # Templates de documentação
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Docker (opcional, para usar containers)

### Instalação Automática (Recomendado)

**Windows (PowerShell):**
```powershell
.\scripts\setup-initial.ps1
```

Este script automaticamente:
- ✅ Verifica se o Hardhat node está rodando (inicia se necessário)
- ✅ Verifica se os contratos estão implantados (faz deploy se necessário)
- ✅ Atualiza os endereços dos contratos no backend
- ✅ Verifica se o backend está configurado corretamente

### Instalação Manual

1. **Instalar todas as dependências:**
```bash
npm run install:all
```

2. **Configurar variáveis de ambiente:**

**Contracts:**
```bash
cd contracts
cp .env.example .env
# Edite .env com suas chaves
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
# Adicione seu WalletConnect Project ID
```

**Backend:**
```bash
cd backend
cp .env.example .env
# Configure database e blockchain
```

### Desenvolvimento

**Terminal 1 - Blockchain Local:**
```bash
cd contracts
npm run node
```

**Terminal 2 - Deploy Contracts:**
```bash
cd contracts
npm run deploy:local
```

**Terminal 3 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm run dev
```

Acesse: http://localhost:3000

## 📚 Documentação

### Documentação Principal
- [Índice da Documentação](./docs/README.md) - Estrutura completa da documentação
- [Arquitetura](./docs/ARCHITECTURE.md) - Arquitetura do sistema

### Planejamento
- [Plano do Projeto](./docs/planning/PLANO_PROJETO_DEPIN.md)
- [Metodologia](./docs/planning/METODOLOGIA_13_PASSOS.md)
- [Resumo Executivo](./docs/status/RESUMO_EXECUTIVO.md)

### Módulos
- [Backend](./backend/README.md) - Documentação do backend
- [Smart Contracts](./contracts/README.md) - Contratos inteligentes

## 🧪 Testes

```bash
# Testar smart contracts
cd contracts
npm run test

# Testar backend (em breve)
cd backend
npm run test
```

## 📦 Build

```bash
# Compilar contratos
npm run build:contracts

# Build frontend
npm run build:frontend

# Build backend
npm run build:backend
```

## 🔐 Segurança

- Todos os smart contracts serão auditados antes do deploy em mainnet
- Use apenas testnets durante desenvolvimento
- Nunca commite chaves privadas ou .env files

## 📄 Licença

MIT

## 👥 Equipe

**Empresa:** Innexar  
**Projeto:** InnexGrid

---

**Status:** 🚧 Em Desenvolvimento - Fase 1: Fundação
