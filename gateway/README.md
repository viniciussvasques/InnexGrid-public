# 🚪 InnexGrid Gateway Service

Serviço de Gateway para proxy e túneis de recursos DePIN.

## 📋 Descrição

O Gateway Service é responsável por:
- Criar túneis reversos para providers (app desktop)
- Gerenciar conexões entre consumers e providers
- Fazer proxy de requisições
- Monitorar uso de recursos
- Registrar métricas no Backend API

## 🏗️ Arquitetura

```
Consumer (Frontend) → Gateway (Porta 3002) → Provider (App Desktop)
                              ↓
                        Backend API (Porta 3001)
```

## 🐳 Docker (Recomendado)

### Desenvolvimento

```bash
# Usar docker-compose do projeto raiz
cd ..
docker-compose up gateway

# Ou usar compose específico do gateway
docker-compose -f gateway/docker-compose.dev.yml up
```

### Produção

```bash
# Build
docker build -t innexgrid-gateway .

# Run
docker run -d \
  --name innexgrid-gateway \
  -p 3002:3002 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e BACKEND_API_URL=http://backend:3001 \
  innexgrid-gateway
```

## 📦 Instalação Local

```bash
npm install
```

## ⚙️ Configuração

1. Copie `.env.example` para `.env`
2. Configure as variáveis de ambiente:
   - `DATABASE_URL` - URL do PostgreSQL
   - `BACKEND_API_URL` - URL do Backend API
   - `GATEWAY_PUBLIC_URL` - URL pública do gateway

## 🏃 Executar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📦 Estrutura

```
gateway/
├── src/
│   ├── server.ts              # Servidor principal
│   ├── config/                # Configurações
│   ├── services/              # Services principais
│   ├── proxy/                 # Proxy handlers
│   ├── routes/                # Rotas Express
│   └── utils/                 # Utilitários
├── Dockerfile                 # Docker para produção
├── docker-compose.dev.yml     # Docker para desenvolvimento
├── package.json
├── tsconfig.json
└── .env
```

## 🔗 Comunicação

- **Backend API**: Valida providers, reservas, processa pagamentos
- **Providers**: Conectam via túnel reverso
- **Consumers**: Acessam recursos via proxy

## 📝 Endpoints

### Provider
- `POST /api/gateway/providers/register` - Registrar provider
- `POST /api/gateway/providers/heartbeat` - Atualizar heartbeat
- `POST /api/gateway/providers/disconnect` - Desconectar

### Connection
- `POST /api/gateway/connections` - Criar conexão
- `GET /api/gateway/connections/:id` - Obter conexão
- `DELETE /api/gateway/connections/:id` - Fechar conexão
- `ALL /api/gateway/connections/:id/*` - Proxy de requisições

## 🗄️ Database

O Gateway compartilha o banco de dados com o Backend. Execute as migrations:

```bash
cd ../backend
node scripts/migrate.js
```

## 🧪 Testes

```bash
npm test
```

## 📊 Health Check

```bash
curl http://localhost:3002/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```
