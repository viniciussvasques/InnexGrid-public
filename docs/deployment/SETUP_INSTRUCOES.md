# 🚀 Instruções de Setup - InnexGrid

## Passo a Passo para Iniciar o Desenvolvimento

### 1. Instalar Dependências

Execute na raiz do projeto:
```bash
npm install
```

Depois instale as dependências de cada módulo:
```bash
npm run install:all
```

Ou individualmente:
```bash
npm run install:contracts
npm run install:frontend
npm run install:backend
```

### 2. Configurar Variáveis de Ambiente

#### Contracts (.env)
```bash
cd contracts
cp .env.example .env
```

Edite o `.env` e adicione:
- `PRIVATE_KEY`: Sua chave privada (para deploy)
- `POLYGON_MUMBAI_RPC_URL`: RPC do Polygon Mumbai
- `POLYGONSCAN_API_KEY`: API key do Polygonscan (para verificação)

#### Frontend (.env.local)
```bash
cd frontend
cp .env.example .env.local
```

Edite o `.env.local` e adicione:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Obtenha em https://cloud.walletconnect.com

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edite o `.env` e configure:
- `DATABASE_URL`: URL do PostgreSQL
- `REDIS_URL`: URL do Redis (opcional)
- `PRIVATE_KEY`: Chave privada para interagir com blockchain
- `RPC_URL`: RPC do Polygon Mumbai

### 3. Iniciar Desenvolvimento

#### Opção 1: Desenvolvimento Completo (4 terminais)

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
Copie os endereços dos contratos e adicione nos arquivos `.env` do frontend e backend.

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

#### Opção 2: Apenas Frontend (para testes de UI)

```bash
cd frontend
npm run dev
```

### 4. Testar Smart Contracts

```bash
cd contracts
npm run test
```

### 5. Compilar Contratos

```bash
cd contracts
npm run compile
```

## Estrutura Criada

✅ Estrutura de pastas completa  
✅ Smart contracts básicos (Token, ResourceProvider, RewardDistribution)  
✅ Frontend Next.js com Web3Modal  
✅ Backend Node.js/Express  
✅ Configurações TypeScript  
✅ Documentação de arquitetura  

## Próximos Passos

1. ✅ Setup inicial completo
2. ⏭️ Implementar funcionalidades dos smart contracts
3. ⏭️ Criar dashboard de provedores
4. ⏭️ Criar dashboard de consumidores
5. ⏭️ Integrar frontend com smart contracts
6. ⏭️ Implementar API do backend

## Troubleshooting

### Erro: "Cannot find module"
Execute `npm install` na pasta específica.

### Erro: "Private key not set"
Certifique-se de ter configurado o `.env` corretamente.

### Erro: "Port already in use"
Altere a porta no arquivo de configuração ou pare o processo que está usando a porta.

## Suporte

Consulte a documentação em:
- [Plano do Projeto](./PLANO_PROJETO_DEPIN.md)
- [Arquitetura](./docs/ARCHITECTURE.md)
- [Smart Contracts](./contracts/README.md)


