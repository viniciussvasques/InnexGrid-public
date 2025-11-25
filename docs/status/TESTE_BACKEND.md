# 🧪 Como Testar o Backend

## ⚠️ Problema Identificado

O backend pode não estar iniciando porque o `BlockchainService` tenta conectar ao blockchain na inicialização. Se o Hardhat node não estiver rodando, o servidor pode falhar.

## ✅ Solução

1. **Certifique-se de que o Hardhat node está rodando:**

```bash
cd contracts
npm run node
```

2. **Configure o arquivo `.env` do backend:**

```env
PORT=3001
RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RESOURCE_PROVIDER_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
REWARD_DISTRIBUTION_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
TOKEN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

3. **Inicie o backend:**

```bash
cd backend
npm run dev
```

## 🧪 Testar Endpoints

### 1. Health Check

```bash
curl http://localhost:3001/health
```

### 2. API Info

```bash
curl http://localhost:3001/api
```

### 3. Listar Provedores

```bash
curl http://localhost:3001/api/providers
```

### 4. Registrar Provedor

```bash
curl -X POST http://localhost:3001/api/providers/register \
  -H "Content-Type: application/json" \
  -d '{
    "providerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "resourceType": "internet",
    "capacity": "1000",
    "pricePerUnit": "10"
  }'
```

### 5. Obter Provedor

```bash
curl http://localhost:3001/api/providers/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## 📝 Script PowerShell

Use o script `test-api.ps1`:

```powershell
cd backend
.\test-api.ps1
```

## 🔍 Verificar Logs

Se o servidor não iniciar, verifique:

1. Se o Hardhat node está rodando na porta 8545
2. Se o arquivo `.env` está configurado corretamente
3. Se há erros no console do servidor

## ✅ Próximos Passos

Após o backend estar funcionando:

1. Testar todos os endpoints
2. Conectar frontend ao backend
3. Testar fluxo completo de registro

