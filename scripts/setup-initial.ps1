# Script de Setup Inicial - InnexGrid
# Verifica e configura tudo automaticamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP INICIAL - INNEXGRID" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# 1. Verificar se Hardhat node está rodando
Write-Host "1. Verificando Hardhat node..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 2
    Write-Host "   ✅ Hardhat node está rodando" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Hardhat node não está rodando" -ForegroundColor Yellow
    Write-Host "   Iniciando Hardhat node em background..." -ForegroundColor Yellow
    
    $hardhatProcess = Start-Process -FilePath "npm" -ArgumentList "run", "node" -WorkingDirectory "contracts" -PassThru -WindowStyle Hidden
    Write-Host "   Aguardando Hardhat iniciar (10 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verificar novamente
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 2
        Write-Host "   ✅ Hardhat node iniciado com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Falha ao iniciar Hardhat node. Execute manualmente: cd contracts && npm run node" -ForegroundColor Red
        exit 1
    }
}

# 2. Verificar se contratos estão implantados
Write-Host ""
Write-Host "2. Verificando se contratos estão implantados..." -ForegroundColor Yellow

$contractsPath = "backend\src\config\addresses.local.json"
if (Test-Path $contractsPath) {
    $addresses = Get-Content $contractsPath | ConvertFrom-Json
    $resourceProvider = $addresses.resourceProvider
    
    # Verificar se o contrato tem código
    try {
        $checkCode = @{
            jsonrpc = "2.0"
            method = "eth_getCode"
            params = @($resourceProvider, "latest")
            id = 1
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -Body $checkCode -ContentType "application/json" -UseBasicParsing
        $result = ($response.Content | ConvertFrom-Json).result
        
        if ($result -eq "0x" -or $result -eq $null) {
            Write-Host "   ⚠️  Contratos não estão implantados" -ForegroundColor Yellow
            Write-Host "   Fazendo deploy dos contratos..." -ForegroundColor Yellow
            
            Push-Location contracts
            npm run deploy:local
            if ($LASTEXITCODE -ne 0) {
                Write-Host "   ❌ Falha ao fazer deploy dos contratos" -ForegroundColor Red
                Pop-Location
                exit 1
            }
            Pop-Location
            
            # Atualizar endereços no backend
            Write-Host "   Atualizando endereços no backend..." -ForegroundColor Yellow
            # Os endereços padrão do Hardhat são:
            $newAddresses = @{
                resourceProvider = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
                rewardDistribution = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
                token = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
            }
            
            $newAddresses | ConvertTo-Json | Set-Content $contractsPath
            $newAddresses | ConvertTo-Json | Set-Content "backend\src\config\addresses.development.json"
            
            Write-Host "   ✅ Contratos implantados e endereços atualizados" -ForegroundColor Green
        } else {
            Write-Host "   ✅ Contratos já estão implantados" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Não foi possível verificar contratos: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Arquivo de endereços não encontrado, fazendo deploy..." -ForegroundColor Yellow
    Push-Location contracts
    npm run deploy:local
    Pop-Location
}

# 3. Verificar backend
Write-Host ""
Write-Host "3. Verificando backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2
    $health = $response.Content | ConvertFrom-Json
    
    if ($health.blockchain.status -eq "connected") {
        Write-Host "   ✅ Backend está rodando e conectado ao blockchain" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backend está rodando mas blockchain não está conectado" -ForegroundColor Yellow
        Write-Host "   Verifique RPC_URL e PRIVATE_KEY no .env do backend" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Backend não está rodando ou não responde" -ForegroundColor Yellow
    Write-Host "   Inicie o backend: cd backend && npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

