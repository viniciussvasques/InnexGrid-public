# Guia de Teste Rápido - Frontend Web

## Pré-requisitos
```powershell
# 1. Backend rodando
cd C:\web3\backend
docker-compose up -d

# 2. Contratos deployados
cd C:\web3\contracts
npm run deploy:local

# 3. Frontend rodando
cd C:\web3\frontend
npm run dev
```

## Teste 1: Autenticação JWT

1. Abra o console do navegador (F12)
2. Conecte sua wallet (MetaMask)
3. Vá para `/consumer`
4. Tente reservar um recurso
5. **Esperado**: Modal pedindo para assinar mensagem de login
6. **Verifique**: No localStorage deve aparecer `innexgrid_auth_token`

## Teste 2: Conversão de Preços

1. Registre um provider com preço `100000000000000000` (0.1 INGRID em wei)
2. Vá para `/consumer`
3. **Esperado**: Card mostra `0.1000 INGRID` e não `100000000000000000`
4. Reserve 100 unidades
5. **Esperado**: Custo total = `10.0000 INGRID` (100 × 0.1)

## Teste 3: Validação de Capacidade

1. Provider com capacidade total: `1000`, usado: `800`
2. Tente reservar `300` unidades (disponível: 200)
3. **Esperado**: Alert "Quantidade solicitada (300) excede a capacidade disponível (200 unidades)"
4. Agora reserve `150` unidades
5. **Esperado**: Reserva bem-sucedida

## Teste 4: Tradução

1. Clique no ícone de idioma (🌐)
2. Troque para English
3. **Esperado**: 
   - Botão "Connect Wallet" (antes era "Conectar Carteira")
   - Navbar "Disconnect" (antes "Desconectar")
   - Stats em inglês

## Teste 5: Taxa da Plataforma (5%)

1. Provider ganha 1000 tokens de recompensa
2. Execute `POST /api/providers/:address/distribute-reward`
3. **Esperado**:
   - Provider recebe: `950 INGRID` (95%)
   - Owner recebe: `50 INGRID` (5%)
4. Verifique no contrato:
```javascript
const provider = await resourceProvider.getProvider(address)
console.log(provider.totalEarnings) // 950000000000000000000 (950 tokens)
```

## Comandos Úteis

### Verificar JWT no backend
```powershell
curl http://localhost:3001/api/auth/verify `
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Registrar provider via API
```powershell
$body = @{
  providerAddress = '0x995B0DaF838F1Bd11ac0B4771824353f54C3836a'
  resourceType = 'compute'
  capacity = '1000'
  pricePerUnit = '100000000000000000'  # 0.1 INGRID em wei
} | ConvertTo-Json

Invoke-WebRequest -Method Post `
  -Uri 'http://localhost:3001/api/providers/register' `
  -Headers @{
    'Content-Type'='application/json'
    'x-wallet-address'='0x995B0DaF838F1Bd11ac0B4771824353f54C3836a'
  } `
  -Body $body
```

### Listar recursos no marketplace
```powershell
curl http://localhost:3001/api/marketplace
```

## ✅ Checklist de Testes

- [ ] Login com assinatura gera JWT válido
- [ ] JWT é armazenado no localStorage
- [ ] Reservas usam `Authorization: Bearer <token>`
- [ ] Preços exibidos em formato legível (0.1000 INGRID)
- [ ] Custo total calculado corretamente
- [ ] Validação bloqueia reservas > capacidade
- [ ] Tradução funciona em PT e EN
- [ ] Taxa de 5% deduzida nas recompensas
- [ ] Provider dashboard mostra earnings corretos
- [ ] Consumer page lista recursos disponíveis

## Problemas Conhecidos

### JWT Expired
**Sintoma**: Erro 401 após 24h
**Solução**: Usuário precisa fazer login novamente (assinar mensagem)

### MetaMask não conecta
**Sintoma**: Botão "Connect Wallet" não abre MetaMask
**Solução**: Verificar se MetaMask está instalado; recarregar página

### Preços ainda aparecem em wei
**Sintoma**: `100000000000000000` em vez de `0.1000`
**Solução**: Backend está retornando string; verificar se `ethers.formatUnits` está sendo aplicado

## Próximos Testes (Desktop App)

Quando migrarmos para Electron:
- [ ] Notificações desktop ao ganhar tokens
- [ ] Background monitoring de recursos
- [ ] Auto-connect com MetaMask desktop
- [ ] Sincronização offline → online
- [ ] Instalador Windows (.exe)
