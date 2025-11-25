# 📋 Plano de Implementação Organizado - Gateway Separado

## 🎯 Decisão Arquitetural

**Gateway será um serviço SEPARADO do backend API**

### Estrutura de Projetos:
```
web3/
├── backend/          # Backend API (REST) - Porta 3001
├── gateway/          # Gateway Service (NOVO) - Porta 3002
├── frontend/         # Frontend Next.js
├── desktop/          # App Desktop Electron
└── contracts/        # Smart Contracts
```

---

## 📦 Estrutura do Gateway (Novo Projeto)

```
gateway/
├── src/
│   ├── server.ts                 # Servidor principal
│   ├── config/
│   │   └── config.ts             # Configurações
│   ├── services/
│   │   ├── backend-client.ts     # Cliente para Backend API
│   │   ├── tunnel-manager.ts     # Gerenciar túneis
│   │   ├── connection-manager.ts # Gerenciar conexões
│   │   └── usage-monitor.ts      # Monitorar uso
│   ├── proxy/
│   │   └── proxy-handler.ts      # Handler de proxy
│   ├── routes/
│   │   ├── provider.routes.ts    # Rotas de provider
│   │   └── connection.routes.ts  # Rotas de conexão
│   └── utils/
│       └── logger.ts             # Logger
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 📋 Checklist de Implementação (Ordem Correta)

### **FASE 1: Setup do Projeto Gateway** ⏳

1. [ ] Criar estrutura de pastas `gateway/`
2. [ ] Criar `gateway/package.json`
3. [ ] Criar `gateway/tsconfig.json`
4. [ ] Criar `gateway/.env.example`
5. [ ] Criar `gateway/README.md`

### **FASE 2: Configuração e Utils** ⏳

1. [ ] Criar `gateway/src/config/config.ts`
2. [ ] Criar `gateway/src/utils/logger.ts`
3. [ ] Criar `gateway/src/services/backend-client.ts`

### **FASE 3: Core Services** ⏳

1. [ ] Criar `gateway/src/services/tunnel-manager.ts`
2. [ ] Criar `gateway/src/services/connection-manager.ts`
3. [ ] Criar `gateway/src/services/usage-monitor.ts`

### **FASE 4: Proxy e Routes** ⏳

1. [ ] Criar `gateway/src/proxy/proxy-handler.ts`
2. [ ] Criar `gateway/src/routes/provider.routes.ts`
3. [ ] Criar `gateway/src/routes/connection.routes.ts`

### **FASE 5: Server Principal** ⏳

1. [ ] Criar `gateway/src/server.ts`
2. [ ] Integrar todas as rotas
3. [ ] Testes básicos

### **FASE 6: Integração Desktop** ⏳

1. [ ] Criar `desktop/electron/services/gateway-integration.ts`
2. [ ] Criar `desktop/electron/services/resource-server.ts`
3. [ ] Atualizar IPC handlers

### **FASE 7: Client SDK** ⏳

1. [ ] Criar `frontend/lib/innexgrid-client.ts`
2. [ ] Integrar no Consumer Page

### **FASE 8: UI Updates** ⏳

1. [ ] Atualizar Provider Page
2. [ ] Atualizar Consumer Page

---

## 🗄️ Database: Tabelas Necessárias

### **Tabelas no Backend Database (compartilhado):**

```sql
-- Tabela de túneis (providers conectados)
CREATE TABLE gateway_tunnels (
  id SERIAL PRIMARY KEY,
  provider_address VARCHAR(42) NOT NULL,
  local_endpoint TEXT NOT NULL,
  public_endpoint TEXT NOT NULL,
  connection_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_heartbeat TIMESTAMP DEFAULT NOW()
);

-- Tabela de conexões (consumer ↔ provider)
CREATE TABLE gateway_connections (
  id SERIAL PRIMARY KEY,
  connection_id VARCHAR(255) UNIQUE NOT NULL,
  consumer_address VARCHAR(42) NOT NULL,
  provider_address VARCHAR(42) NOT NULL,
  reservation_id VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  amount TEXT NOT NULL,
  public_endpoint TEXT NOT NULL,
  access_token TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  closed_at TIMESTAMP
);

-- Tabela de métricas de uso
CREATE TABLE gateway_usage_metrics (
  id SERIAL PRIMARY KEY,
  connection_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  compute_cpu_time DECIMAL,
  compute_cores INTEGER,
  storage_bytes_read BIGINT,
  storage_bytes_written BIGINT,
  bandwidth_bytes_in BIGINT,
  bandwidth_bytes_out BIGINT,
  cost TEXT
);

-- Índices
CREATE INDEX idx_tunnels_provider ON gateway_tunnels(provider_address);
CREATE INDEX idx_tunnels_active ON gateway_tunnels(is_active);
CREATE INDEX idx_connections_consumer ON gateway_connections(consumer_address);
CREATE INDEX idx_connections_provider ON gateway_connections(provider_address);
CREATE INDEX idx_connections_status ON gateway_connections(status);
CREATE INDEX idx_usage_connection ON gateway_usage_metrics(connection_id);
CREATE INDEX idx_usage_timestamp ON gateway_usage_metrics(timestamp);
```

---

## 🔗 Comunicação Gateway ↔ Backend

### **Gateway chama Backend API:**

```typescript
// gateway/src/services/backend-client.ts
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

// Endpoints que Gateway precisa chamar:
// - GET /api/providers/:address (validar provider)
// - GET /api/marketplace/reservation/:id (validar reserva)
// - POST /api/usage/record (registrar uso)
// - POST /api/payments/process (processar pagamento)
```

---

## 📝 Próximos Passos (Ordem Correta)

1. **Criar estrutura de pastas do gateway**
2. **Criar package.json e configurações**
3. **Criar migrations SQL (no backend)**
4. **Implementar services do gateway**
5. **Implementar routes do gateway**
6. **Testar integração**

---

**Vou começar organizadamente agora!** 🚀

