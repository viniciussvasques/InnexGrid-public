# 🌐 Arquitetura de Gateway de Recursos - Como as Grandes Empresas Fazem

## 💡 Conceito: Gateway de Acesso + Monitoramento Automático

Inspirado em **AWS, Google Cloud, Azure** - oferecer uma **API/Gateway** que:
1. ✅ Conecta o consumer ao recurso do provider
2. ✅ Monitora uso em tempo real automaticamente
3. ✅ Processa pagamento baseado em uso real
4. ✅ Fornece métricas e logs

---

## 🏗️ Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA COMPLETA                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Consumer  │────────▶│   Gateway    │────────▶│  Provider   │
│  (Frontend) │         │   Service    │         │  (Desktop)  │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              │ Monitora uso
                              ▼
                        ┌──────────────┐
                        │   Oracle/    │
                        │  Monitoring  │
                        └──────────────┘
                              │
                              │ Atualiza blockchain
                              ▼
                        ┌──────────────┐
                        │  Blockchain  │
                        │  + Payment   │
                        └──────────────┘
```

---

## 🔧 Componentes Principais

### 1. **Gateway Service** (Backend)
**Função:** Intermediário entre consumer e provider

```typescript
// backend/src/services/gateway.service.ts
export class GatewayService {
  /**
   * Criar conexão segura entre consumer e provider
   */
  async createConnection(
    consumerAddress: string,
    providerAddress: string,
    resourceType: string,
    amount: number
  ): Promise<Connection> {
    // 1. Validar reserva
    const reservation = await this.validateReservation(
      consumerAddress,
      providerAddress,
      resourceType
    );
    
    // 2. Criar endpoint de acesso único
    const connectionId = generateConnectionId();
    const accessToken = generateSecureToken();
    
    // 3. Configurar proxy/tunnel
    const endpoint = await this.setupProxy(
      providerAddress,
      resourceType,
      connectionId
    );
    
    // 4. Iniciar monitoramento
    await monitoringService.startMonitoring(connectionId, {
      consumerAddress,
      providerAddress,
      resourceType,
      amount,
      startTime: Date.now()
    });
    
    return {
      connectionId,
      endpoint, // Ex: https://gateway.innexgrid.com/compute/{connectionId}
      accessToken,
      expiresAt: reservation.endTime
    };
  }
  
  /**
   * Proxy de requisições para o provider
   */
  async proxyRequest(
    connectionId: string,
    request: Request
  ): Promise<Response> {
    // 1. Validar conexão
    const connection = await this.getConnection(connectionId);
    if (!connection.isActive) {
      throw new Error('Connection expired');
    }
    
    // 2. Medir uso antes da requisição
    const usageBefore = await this.measureUsage(connectionId);
    
    // 3. Encaminhar requisição para provider
    const response = await this.forwardToProvider(
      connection.providerEndpoint,
      request
    );
    
    // 4. Medir uso após requisição
    const usageAfter = await this.measureUsage(connectionId);
    
    // 5. Registrar uso incremental
    await this.recordUsage(connectionId, {
      bytesTransferred: usageAfter.bytes - usageBefore.bytes,
      computeTime: usageAfter.computeTime - usageBefore.computeTime,
      timestamp: Date.now()
    });
    
    return response;
  }
}
```

### 2. **Resource Proxy** (App Desktop do Provider)
**Função:** Expor recursos localmente de forma segura

```typescript
// desktop/electron/services/resource-proxy.ts
export class ResourceProxy {
  private server: http.Server | null = null;
  private activeConnections: Map<string, Connection> = new Map();
  
  /**
   * Iniciar servidor local para expor recursos
   */
  async startServer(port: number = 0) {
    this.server = http.createServer(async (req, res) => {
      const connectionId = this.extractConnectionId(req);
      
      if (!connectionId || !this.activeConnections.has(connectionId)) {
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }
      
      const connection = this.activeConnections.get(connectionId)!;
      
      // Medir uso antes
      const usageBefore = await this.measureCurrentUsage(connection);
      
      // Processar requisição
      await this.handleRequest(req, res, connection);
      
      // Medir uso depois e reportar
      const usageAfter = await this.measureCurrentUsage(connection);
      await this.reportUsage(connectionId, {
        delta: usageAfter - usageBefore,
        timestamp: Date.now()
      });
    });
    
    this.server.listen(port, () => {
      const actualPort = (this.server!.address() as any).port;
      console.log(`Resource proxy listening on port ${actualPort}`);
      
      // Registrar endpoint no backend
      this.registerWithBackend(actualPort);
    });
  }
  
  /**
   * Medir uso atual de recursos
   */
  private async measureCurrentUsage(connection: Connection) {
    const resources = await getSystemResources();
    
    switch (connection.resourceType) {
      case 'compute':
        return {
          cpuTime: resources.compute.usage,
          cores: resources.compute.cores
        };
      case 'storage':
        return {
          bytesRead: await this.getBytesRead(connection),
          bytesWritten: await this.getBytesWritten(connection)
        };
      case 'bandwidth':
        return {
          bytesIn: await this.getNetworkBytesIn(connection),
          bytesOut: await this.getNetworkBytesOut(connection)
        };
    }
  }
}
```

### 3. **Monitoring Service** (Backend)
**Função:** Agregar métricas e processar pagamentos

```typescript
// backend/src/services/monitoring.service.ts
export class MonitoringService {
  private activeConnections: Map<string, ConnectionMetrics> = new Map();
  
  /**
   * Iniciar monitoramento de uma conexão
   */
  async startMonitoring(
    connectionId: string,
    config: ConnectionConfig
  ) {
    this.activeConnections.set(connectionId, {
      connectionId,
      consumerAddress: config.consumerAddress,
      providerAddress: config.providerAddress,
      resourceType: config.resourceType,
      startTime: Date.now(),
      totalUsage: {
        compute: 0,
        storage: 0,
        bandwidth: 0
      },
      usageHistory: []
    });
    
    // Iniciar polling de métricas
    this.startPolling(connectionId);
  }
  
  /**
   * Processar relatório de uso incremental
   */
  async recordUsage(
    connectionId: string,
    usage: UsageDelta
  ) {
    const metrics = this.activeConnections.get(connectionId);
    if (!metrics) return;
    
    // Atualizar métricas
    metrics.totalUsage[metrics.resourceType] += usage.delta;
    metrics.usageHistory.push({
      delta: usage.delta,
      timestamp: usage.timestamp
    });
    
    // Calcular custo incremental
    const cost = this.calculateCost(
      metrics.resourceType,
      usage.delta,
      metrics.providerAddress
    );
    
    // Processar pagamento incremental
    await this.processIncrementalPayment(
      connectionId,
      cost
    );
  }
  
  /**
   * Processar pagamento incremental (micro-pagamentos)
   */
  private async processIncrementalPayment(
    connectionId: string,
    amount: bigint
  ) {
    const metrics = this.activeConnections.get(connectionId)!;
    
    // Acumular em buffer (evitar muitas transações)
    if (!metrics.paymentBuffer) {
      metrics.paymentBuffer = 0n;
    }
    metrics.paymentBuffer += amount;
    
    // Se buffer atingir threshold, processar pagamento
    const threshold = ethers.parseUnits('0.01', 18); // 0.01 tokens
    if (metrics.paymentBuffer >= threshold) {
      await paymentService.processPayment({
        consumerAddress: metrics.consumerAddress,
        providerAddress: metrics.providerAddress,
        amount: metrics.paymentBuffer.toString(),
        connectionId
      });
      
      metrics.paymentBuffer = 0n;
    }
  }
}
```

### 4. **Client SDK** (Frontend)
**Função:** Facilitar conexão do consumer aos recursos

```typescript
// frontend/lib/innexgrid-sdk.ts
export class InnexGridClient {
  private gatewayUrl: string;
  private connectionId: string | null = null;
  
  constructor(gatewayUrl: string) {
    this.gatewayUrl = gatewayUrl;
  }
  
  /**
   * Conectar a um recurso de provider
   */
  async connectToResource(
    providerAddress: string,
    resourceType: string,
    amount: number
  ): Promise<Connection> {
    // 1. Criar reserva
    const reservation = await this.createReservation(
      providerAddress,
      resourceType,
      amount
    );
    
    // 2. Obter conexão do gateway
    const response = await fetch(`${this.gatewayUrl}/connections`, {
      method: 'POST',
      body: JSON.stringify({
        reservationId: reservation.id,
        consumerAddress: await this.getWalletAddress()
      })
    });
    
    const connection = await response.json();
    this.connectionId = connection.connectionId;
    
    return connection;
  }
  
  /**
   * Usar recurso (exemplo: compute)
   */
  async executeComputeTask(
    task: ComputeTask
  ): Promise<ComputeResult> {
    if (!this.connectionId) {
      throw new Error('Not connected to resource');
    }
    
    // Requisição passa pelo gateway (que monitora)
    const response = await fetch(
      `${this.gatewayUrl}/connections/${this.connectionId}/compute`,
      {
        method: 'POST',
        body: JSON.stringify(task)
      }
    );
    
    return await response.json();
  }
  
  /**
   * Usar storage
   */
  async storeData(
    data: Uint8Array,
    path: string
  ): Promise<void> {
    if (!this.connectionId) {
      throw new Error('Not connected to resource');
    }
    
    await fetch(
      `${this.gatewayUrl}/connections/${this.connectionId}/storage`,
      {
        method: 'PUT',
        body: data,
        headers: {
          'X-Path': path
        }
      }
    );
  }
}
```

---

## 📊 Fluxo Completo

### 1. Consumer Reserva e Conecta

```typescript
// Frontend
const client = new InnexGridClient('https://gateway.innexgrid.com');

// 1. Reservar recurso
const reservation = await marketplaceService.reserveResource({
  providerAddress: '0x...',
  resourceType: 'compute',
  amount: 10,
  duration: 3600 // 1 hora
});

// 2. Conectar via gateway
const connection = await client.connectToResource(
  '0x...',
  'compute',
  10
);

// 3. Usar recurso (tudo monitorado automaticamente)
const result = await client.executeComputeTask({
  code: '...',
  input: '...'
});
```

### 2. Gateway Monitora e Processa Pagamento

```
Consumer faz requisição
    ↓
Gateway intercepta
    ↓
Mede uso antes
    ↓
Encaminha para Provider
    ↓
Provider processa
    ↓
Gateway mede uso depois
    ↓
Calcula custo incremental
    ↓
Processa micro-pagamento (se acumulado)
    ↓
Retorna resultado para Consumer
```

### 3. Provider Expõe Recursos

```typescript
// App Desktop do Provider
const proxy = new ResourceProxy();

// Iniciar servidor local
await proxy.startServer();

// Registrar no backend
await backend.registerProvider({
  address: walletAddress,
  endpoint: `http://localhost:${port}`,
  resources: detectedResources
});
```

---

## 🎯 Vantagens desta Abordagem

### ✅ Similar a AWS/Azure
- Consumer usa API simples
- Monitoramento transparente
- Pagamento automático

### ✅ Segurança
- Gateway valida todas as requisições
- Tokens de acesso únicos
- Rate limiting automático

### ✅ Escalabilidade
- Gateway pode balancear carga
- Múltiplos providers podem servir
- Cache de resultados

### ✅ Transparência
- Consumer vê uso em tempo real
- Provider vê métricas detalhadas
- Tudo auditável no blockchain

---

## 🔐 Segurança e Isolamento

### 1. **Sandbox para Compute**
```typescript
// Executar código do consumer em sandbox isolado
const sandbox = await createSandbox({
  memoryLimit: connection.amount * 1024 * 1024, // MB
  cpuLimit: connection.amount, // cores
  timeout: 30000 // 30s
});

const result = await sandbox.execute(consumerCode);
```

### 2. **Quotas e Rate Limiting**
```typescript
// Gateway aplica limites
const quota = await getQuota(connectionId);
if (quota.used >= quota.limit) {
  throw new Error('Quota exceeded');
}
```

### 3. **Validação de Requisições**
```typescript
// Validar cada requisição
await validateRequest({
  connectionId,
  method: req.method,
  path: req.path,
  size: req.body.length
});
```

---

## 📈 Métricas e Observabilidade

### Dashboard do Consumer
- Uso atual em tempo real
- Custo acumulado
- Histórico de requisições
- Previsão de custo

### Dashboard do Provider
- Conexões ativas
- Uso de recursos
- Receita em tempo real
- Performance metrics

---

## 🚀 Implementação por Fases

### Fase 1: Gateway Básico (2-3 semanas)
- [ ] Gateway Service no backend
- [ ] Proxy simples para requisições
- [ ] Monitoramento básico de uso
- [ ] Pagamento ao final da conexão

### Fase 2: Monitoramento Avançado (2 semanas)
- [ ] Métricas em tempo real
- [ ] Micro-pagamentos incrementais
- [ ] Dashboard de métricas
- [ ] Alertas de quota

### Fase 3: SDK e Integração (1-2 semanas)
- [ ] Client SDK para frontend
- [ ] Resource Proxy no app desktop
- [ ] Exemplos de uso
- [ ] Documentação completa

### Fase 4: Otimizações (1-2 semanas)
- [ ] Cache de resultados
- [ ] Load balancing
- [ ] Compressão de dados
- [ ] Otimização de custos

---

## 💡 Exemplos de Uso

### Compute (CPU/GPU)
```typescript
// Consumer executa código remoto
const result = await client.executeComputeTask({
  language: 'python',
  code: `
    def process(data):
        return sum(data) * 2
  `,
  input: [1, 2, 3, 4, 5]
});
// Paga apenas pelo tempo de CPU usado
```

### Storage
```typescript
// Consumer armazena dados
await client.storeData(
  new Uint8Array([1, 2, 3]),
  '/my-data/file.bin'
);
// Paga apenas pelos bytes armazenados
```

### Bandwidth
```typescript
// Consumer faz streaming
const stream = await client.createStream('/video.mp4');
// Paga apenas pelos bytes transferidos
```

---

## 🎁 Comparação com Soluções Existentes

| Feature | AWS Lambda | Google Cloud Functions | **InnexGrid Gateway** |
|---------|------------|------------------------|----------------------|
| Pay per use | ✅ | ✅ | ✅ |
| Auto-scaling | ✅ | ✅ | ✅ (via múltiplos providers) |
| Real-time monitoring | ✅ | ✅ | ✅ |
| Decentralized | ❌ | ❌ | ✅ |
| No vendor lock-in | ❌ | ❌ | ✅ |
| Transparent pricing | ⚠️ | ⚠️ | ✅ (blockchain) |

---

## ❓ Próximos Passos

1. **Decidir escopo inicial:**
   - Qual tipo de recurso primeiro? (Compute, Storage, Bandwidth)
   - Nível de complexidade do gateway?

2. **Definir protocolo:**
   - REST API?
   - WebSocket para streaming?
   - gRPC para performance?

3. **Priorizar segurança:**
   - Nível de isolamento necessário?
   - Validação de código do consumer?

---

**Recomendação:** Começar com Gateway básico para Compute, depois expandir para Storage e Bandwidth.

