# 🐳 Gateway Service - Docker Setup

## ✅ Configuração Docker Completa

O Gateway Service agora está configurado para rodar em Docker!

## 📦 Arquivos Criados

1. **`gateway/Dockerfile`** - Imagem Docker para produção
2. **`gateway/.dockerignore`** - Arquivos ignorados no build
3. **`gateway/docker-compose.dev.yml`** - Compose para desenvolvimento isolado
4. **`backend/docker-compose.yml`** - Atualizado com serviço Gateway

## 🚀 Como Usar

### Opção 1: Usar docker-compose do backend (Recomendado)

```bash
cd backend
docker-compose up gateway
```

Isso irá iniciar:
- PostgreSQL
- Redis
- Backend API
- **Gateway Service** (novo!)

### Opção 2: Apenas Gateway (desenvolvimento)

```bash
cd gateway
docker-compose -f docker-compose.dev.yml up
```

### Opção 3: Todos os serviços

```bash
cd backend
docker-compose up
```

## 🔧 Configuração

### Variáveis de Ambiente

O Gateway usa as seguintes variáveis (definidas no `docker-compose.yml`):

```env
PORT=3002
BACKEND_API_URL=http://backend:3001
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/innexgrid
GATEWAY_PUBLIC_URL=http://localhost:3002
LOG_LEVEL=info
```

### Personalizar

Edite `backend/docker-compose.yml` ou crie um `.env`:

```env
GATEWAY_PUBLIC_URL=http://seu-dominio.com:3002
JWT_SECRET=seu-secret-aqui
CONNECTION_TOKEN_SECRET=seu-token-secret-aqui
```

## 📊 Verificar Status

```bash
# Ver logs do gateway
docker-compose logs -f gateway

# Health check
curl http://localhost:3002/health

# Ver status
docker-compose ps
```

## 🏗️ Estrutura

```
web3/
├── backend/
│   └── docker-compose.yml    # ✅ Atualizado com Gateway
├── gateway/
│   ├── Dockerfile            # ✅ Dockerfile
│   ├── .dockerignore         # ✅ Ignore
│   └── docker-compose.dev.yml # ✅ Dev compose
└── docs/
    └── DOCKER_SETUP.md       # ✅ Documentação completa
```

## 🧪 Testes

```bash
# Build
docker-compose build gateway

# Run
docker-compose up gateway

# Testar endpoint
curl http://localhost:3002/health
```

## 🔄 Hot Reload

O código fonte está montado como volume, então mudanças são refletidas automaticamente (em dev mode).

## 📝 Próximos Passos

1. ✅ Gateway em Docker
2. ⏳ Integração Desktop App
3. ⏳ Client SDK
4. ⏳ Testes E2E

