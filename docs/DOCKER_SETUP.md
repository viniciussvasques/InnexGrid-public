# 🐳 Docker Setup - InnexGrid

## 📋 Visão Geral

Todos os serviços podem ser executados via Docker para facilitar desenvolvimento e deploy.

## 🚀 Início Rápido

### 1. Subir todos os serviços

```bash
docker-compose up -d
```

Isso irá iniciar:
- PostgreSQL (porta 5432)
- Backend API (porta 3001)
- Gateway Service (porta 3002)
- Redis (porta 6379)

### 2. Executar migrations

```bash
# Entrar no container do backend
docker exec -it innexgrid-backend npm run migrate

# Ou executar manualmente
docker exec -it innexgrid-backend node scripts/migrate.js
```

### 3. Verificar logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas gateway
docker-compose logs -f gateway

# Apenas backend
docker-compose logs -f backend
```

## 📝 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=innexgrid
DB_USER=postgres
DB_PASSWORD=postgres

# Backend
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Gateway
GATEWAY_PUBLIC_URL=http://localhost:3002
JWT_SECRET=your-secret-key-change-in-production
CONNECTION_TOKEN_SECRET=your-connection-token-secret

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

## 🔧 Comandos Úteis

### Parar serviços
```bash
docker-compose down
```

### Parar e remover volumes
```bash
docker-compose down -v
```

### Rebuild após mudanças
```bash
docker-compose up --build
```

### Executar apenas um serviço
```bash
docker-compose up gateway
docker-compose up backend
```

### Acessar shell do container
```bash
docker exec -it innexgrid-gateway sh
docker exec -it innexgrid-backend sh
```

## 🏗️ Estrutura

```
web3/
├── docker-compose.yml          # Compose principal (todos os serviços)
├── backend/
│   └── Dockerfile             # Backend API
├── gateway/
│   ├── Dockerfile             # Gateway Service
│   └── docker-compose.dev.yml # Compose apenas para gateway (dev)
└── .env                       # Variáveis de ambiente
```

## 🧪 Desenvolvimento

### Modo Hot Reload

Os volumes estão configurados para hot reload:
- Código fonte montado como volume
- `node_modules` não montado (usa do container)

### Desenvolvimento apenas do Gateway

```bash
cd gateway
docker-compose -f docker-compose.dev.yml up
```

## 🚢 Produção

### Build das imagens

```bash
docker-compose build
```

### Deploy

```bash
# Com variáveis de ambiente
docker-compose -f docker-compose.yml up -d
```

### Health Checks

Todos os serviços têm health checks configurados:

```bash
# Gateway
curl http://localhost:3002/health

# Backend
curl http://localhost:3001/health

# PostgreSQL
docker exec innexgrid-postgres pg_isready
```

## 📊 Monitoramento

### Ver status dos containers

```bash
docker-compose ps
```

### Ver uso de recursos

```bash
docker stats
```

### Ver logs em tempo real

```bash
docker-compose logs -f --tail=100
```

## 🔒 Segurança

### Produção

1. **Altere todas as senhas padrão**
2. **Use secrets para variáveis sensíveis**
3. **Configure firewall**
4. **Use HTTPS (via nginx/traefik)**

### Secrets

```bash
# Criar arquivo de secrets
echo "DB_PASSWORD=senha-segura" > .env.secrets

# Usar no compose
docker-compose --env-file .env.secrets up
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose logs gateway

# Verificar se porta está em uso
netstat -an | grep 3002
```

### Database connection failed

```bash
# Verificar se postgres está rodando
docker-compose ps postgres

# Verificar logs
docker-compose logs postgres

# Testar conexão
docker exec -it innexgrid-postgres psql -U postgres -d innexgrid
```

### Rebuild completo

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

