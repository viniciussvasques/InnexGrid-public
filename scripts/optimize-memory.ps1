# Script de Otimizacao de Memoria
# Limpa processos orfaos do Node.js, Next.js e outros relacionados ao projeto

Write-Host "[*] Analisando processos e otimizando memoria..." -ForegroundColor Cyan
Write-Host ""

# Funcao para obter memoria em MB
function Get-MemoryMB {
    param($bytes)
    return [math]::Round($bytes / 1MB, 2)
}

# Obter memoria antes da limpeza
$os = Get-CimInstance Win32_OperatingSystem
$memoriaAntes = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB, 2)
Write-Host "[*] Memoria usada antes: $memoriaAntes GB" -ForegroundColor Yellow
Write-Host ""

# Lista de processos para limpar
$processosParaLimpar = @()
$memoriaLiberada = 0

# 1. Processos Node.js orfaos (que nao sao filhos do Cursor)
Write-Host "[*] Verificando processos Node.js..." -ForegroundColor Cyan
$processosNode = Get-Process -Name "node" -ErrorAction SilentlyContinue
$processosCursor = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id

foreach ($proc in $processosNode) {
    try {
        $parentId = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").ParentProcessId
        $isCursorChild = $processosCursor -contains $parentId
        
        # Verificar se esta rodando em portas comuns do projeto
        $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
        $isProjectProcess = $false
        
        if ($commandLine) {
            $isProjectProcess = $commandLine -match "web3|innexgrid|backend|frontend|next|ts-node-dev"
        }
        
        # Se nao e filho do Cursor e nao parece ser do projeto, pode ser orfao
        if (-not $isCursorChild -and -not $isProjectProcess) {
            $memoriaMB = Get-MemoryMB $proc.WorkingSet64
            $processosParaLimpar += [PSCustomObject]@{
                Nome = $proc.ProcessName
                Id = $proc.Id
                MemoriaMB = $memoriaMB
                Tipo = "Node.js orfao"
            }
            $memoriaLiberada += $memoriaMB
        }
    } catch {
        # Ignorar erros ao verificar processo
    }
}

# 2. Processos Next.js orfaos
Write-Host "[*] Verificando processos Next.js..." -ForegroundColor Cyan
$processosNext = Get-Process | Where-Object {
    $_.Path -like "*next*" -or 
    ($_.CommandLine -like "*next dev*" -and $_.ProcessName -eq "node")
} -ErrorAction SilentlyContinue

foreach ($proc in $processosNext) {
    try {
        $parentId = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").ParentProcessId
        $isCursorChild = $processosCursor -contains $parentId
        
        if (-not $isCursorChild) {
            $memoriaMB = Get-MemoryMB $proc.WorkingSet64
            $processosParaLimpar += [PSCustomObject]@{
                Nome = "Next.js"
                Id = $proc.Id
                MemoriaMB = $memoriaMB
                Tipo = "Next.js orfao"
            }
            $memoriaLiberada += $memoriaMB
        }
    } catch {
        # Ignorar erros
    }
}

# 3. Processos ts-node-dev orfaos
Write-Host "[*] Verificando processos ts-node-dev..." -ForegroundColor Cyan
$processosTsNode = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    try {
        $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        return $commandLine -like "*ts-node-dev*"
    } catch {
        return $false
    }
}

foreach ($proc in $processosTsNode) {
    try {
        $parentId = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").ParentProcessId
        $isCursorChild = $processosCursor -contains $parentId
        
        if (-not $isCursorChild) {
            $memoriaMB = Get-MemoryMB $proc.WorkingSet64
            $processosParaLimpar += [PSCustomObject]@{
                Nome = "ts-node-dev"
                Id = $proc.Id
                MemoriaMB = $memoriaMB
                Tipo = "ts-node-dev orfao"
            }
            $memoriaLiberada += $memoriaMB
        }
    } catch {
        # Ignorar erros
    }
}

# 4. Verificar portas comuns e processos relacionados
Write-Host "[*] Verificando portas em uso..." -ForegroundColor Cyan
$portasComuns = @(3000, 3001, 5000, 5001, 5432, 6379, 8080)
$processosPorta = @()

foreach ($porta in $portasComuns) {
    try {
        $conexao = Get-NetTCPConnection -LocalPort $porta -ErrorAction SilentlyContinue
        if ($conexao) {
            $procId = $conexao.OwningProcess
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc -and $proc.ProcessName -eq "node") {
                $parentId = (Get-CimInstance Win32_Process -Filter "ProcessId = $procId").ParentProcessId
                $isCursorChild = $processosCursor -contains $parentId
                
                if (-not $isCursorChild) {
                    $memoriaMB = Get-MemoryMB $proc.WorkingSet64
                    $processosPorta += [PSCustomObject]@{
                        Porta = $porta
                        Processo = $proc.ProcessName
                        Id = $procId
                        MemoriaMB = $memoriaMB
                    }
                }
            }
        }
    } catch {
        # Ignorar erros
    }
}

# Mostrar processos encontrados
Write-Host ""
Write-Host "[*] Processos orfaos encontrados:" -ForegroundColor Yellow
if ($processosParaLimpar.Count -eq 0) {
    Write-Host "   [+] Nenhum processo orfao encontrado!" -ForegroundColor Green
} else {
    $processosParaLimpar | Format-Table -AutoSize
}

if ($processosPorta.Count -gt 0) {
    Write-Host ""
    Write-Host "[*] Processos usando portas comuns:" -ForegroundColor Yellow
    $processosPorta | Format-Table -AutoSize
}

# Perguntar antes de encerrar
if ($processosParaLimpar.Count -gt 0) {
    Write-Host ""
    Write-Host "[!] Total de memoria que sera liberada: $([math]::Round($memoriaLiberada, 2)) MB" -ForegroundColor Yellow
    Write-Host ""
    $confirmacao = Read-Host "Deseja encerrar esses processos? (S/N)"
    
    if ($confirmacao -eq "S" -or $confirmacao -eq "s" -or $confirmacao -eq "Y" -or $confirmacao -eq "y") {
        Write-Host ""
        Write-Host "[*] Encerrando processos..." -ForegroundColor Cyan
        
        foreach ($proc in $processosParaLimpar) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Host "   [+] Processo $($proc.Nome) (ID: $($proc.Id)) encerrado - $($proc.MemoriaMB) MB liberados" -ForegroundColor Green
            } catch {
                Write-Host "   [-] Erro ao encerrar processo $($proc.Nome) (ID: $($proc.Id))" -ForegroundColor Red
            }
        }
        
        # Aguardar um pouco para o sistema atualizar
        Start-Sleep -Seconds 2
        
        # Obter memoria depois da limpeza
        $os = Get-CimInstance Win32_OperatingSystem
        $memoriaDepois = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB, 2)
        $memoriaLiberadaTotal = $memoriaAntes - $memoriaDepois
        
        Write-Host ""
        Write-Host "[+] Otimizacao concluida!" -ForegroundColor Green
        Write-Host "[*] Memoria usada antes: $memoriaAntes GB" -ForegroundColor Yellow
        Write-Host "[*] Memoria usada depois: $memoriaDepois GB" -ForegroundColor Green
        Write-Host "[*] Memoria liberada: $([math]::Round($memoriaLiberadaTotal, 2)) GB" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "[-] Operacao cancelada." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "[+] Nenhum processo orfao encontrado. Sistema ja esta otimizado!" -ForegroundColor Green
}

# Mostrar resumo final
Write-Host ""
Write-Host "[*] Resumo do sistema:" -ForegroundColor Cyan
$os = Get-CimInstance Win32_OperatingSystem
$memoriaTotal = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
$memoriaLivre = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
$memoriaUsada = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB, 2)
$percentualUsado = [math]::Round(($memoriaUsada / $memoriaTotal) * 100, 2)

Write-Host "   Total: $memoriaTotal GB" -ForegroundColor White
$percentualTexto = "$percentualUsado%"
Write-Host "   Usada: $memoriaUsada GB ($percentualTexto)" -ForegroundColor $(if ($percentualUsado -gt 70) { "Red" } elseif ($percentualUsado -gt 50) { "Yellow" } else { "Green" })
Write-Host "   Livre: $memoriaLivre GB" -ForegroundColor Green

Write-Host ""
Write-Host "[*] Dicas para otimizar ainda mais:" -ForegroundColor Cyan
Write-Host "   - Feche abas nao utilizadas no Cursor" -ForegroundColor White
Write-Host "   - Reinicie o Cursor periodicamente para limpar processos acumulados" -ForegroundColor White
Write-Host "   - Verifique extensoes do Cursor que podem estar consumindo memoria" -ForegroundColor White
Write-Host "   - Use este script regularmente para limpar processos orfaos" -ForegroundColor White
