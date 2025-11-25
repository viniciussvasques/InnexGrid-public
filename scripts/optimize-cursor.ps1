# Script de Otimizacao de Processos do Cursor
# Identifica e sugere otimizacoes para processos do Cursor que consomem muita memoria

Write-Host "[*] Analisando processos do Cursor..." -ForegroundColor Cyan
Write-Host ""

# Funcao para obter memoria em MB
function Get-MemoryMB {
    param($bytes)
    return [math]::Round($bytes / 1MB, 2)
}

# Obter todos os processos do Cursor
$processosCursor = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue

if ($processosCursor.Count -eq 0) {
    Write-Host "[-] Nenhum processo do Cursor encontrado." -ForegroundColor Red
    exit
}

Write-Host "[*] Encontrados $($processosCursor.Count) processos do Cursor" -ForegroundColor Yellow
Write-Host ""

# Analisar cada processo
$processosInfo = @()
$memoriaTotal = 0

foreach ($proc in $processosCursor) {
    try {
        $memoriaMB = Get-MemoryMB $proc.WorkingSet64
        $memoriaTotal += $memoriaMB
        
        $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
        $tipo = "Processo principal"
        
        if ($commandLine) {
            if ($commandLine -like "*renderer*") {
                $tipo = "Renderer (aba/janela)"
            } elseif ($commandLine -like "*gpu*") {
                $tipo = "GPU Process"
            } elseif ($commandLine -like "*utility*") {
                $tipo = "Utility"
            } elseif ($commandLine -like "*extension*") {
                $tipo = "Extension Host"
            }
        }
        
        $processosInfo += [PSCustomObject]@{
            Id = $proc.Id
            MemoriaMB = $memoriaMB
            Tipo = $tipo
            StartTime = $proc.StartTime
            Runtime = (Get-Date) - $proc.StartTime
        }
    } catch {
        # Ignorar erros
    }
}

# Ordenar por memoria
$processosInfo = $processosInfo | Sort-Object MemoriaMB -Descending

# Mostrar processos
Write-Host "[*] Processos do Cursor ordenados por uso de memoria:" -ForegroundColor Yellow
$processosInfo | Format-Table -AutoSize

Write-Host ""
Write-Host "[*] Total de memoria usada pelo Cursor: $([math]::Round($memoriaTotal, 2)) MB ($([math]::Round($memoriaTotal / 1024, 2)) GB)" -ForegroundColor Cyan

# Identificar processos que podem ser otimizados
$processosGrandes = $processosInfo | Where-Object { $_.MemoriaMB -gt 200 }
$processosRenderers = $processosInfo | Where-Object { $_.Tipo -like "*Renderer*" }

Write-Host ""
if ($processosGrandes.Count -gt 0) {
    Write-Host "[!] Processos usando mais de 200 MB:" -ForegroundColor Yellow
    $processosGrandes | Format-Table Id, MemoriaMB, Tipo -AutoSize
}

if ($processosRenderers.Count -gt 5) {
    Write-Host ""
    Write-Host "[!] Muitos processos Renderer encontrados ($($processosRenderers.Count))" -ForegroundColor Yellow
    Write-Host "    Isso geralmente indica muitas abas/janelas abertas" -ForegroundColor White
}

# Recomendacoes
Write-Host ""
Write-Host "[*] Recomendacoes:" -ForegroundColor Cyan

if ($processosRenderers.Count -gt 10) {
    Write-Host "   [!] CRITICO: Voce tem $($processosRenderers.Count) processos Renderer" -ForegroundColor Red
    Write-Host "       - Feche abas nao utilizadas no Cursor" -ForegroundColor White
    Write-Host "       - Feche janelas duplicadas" -ForegroundColor White
}

if ($memoriaTotal -gt 2000) {
    Write-Host "   [!] O Cursor esta usando mais de 2 GB de memoria" -ForegroundColor Yellow
    Write-Host "       - Considere reiniciar o Cursor para liberar memoria" -ForegroundColor White
}

if ($processosInfo.Count -gt 15) {
    Write-Host "   [!] Muitos processos do Cursor ($($processosInfo.Count))" -ForegroundColor Yellow
    Write-Host "       - Reinicie o Cursor para limpar processos acumulados" -ForegroundColor White
}

Write-Host ""
Write-Host "[*] Dicas gerais:" -ForegroundColor Cyan
Write-Host "   - Feche arquivos grandes que nao esta usando" -ForegroundColor White
Write-Host "   - Desative extensoes que nao usa frequentemente" -ForegroundColor White
Write-Host "   - Use 'File > Close Editor' para fechar arquivos" -ForegroundColor White
Write-Host "   - Reinicie o Cursor periodicamente (semanalmente)" -ForegroundColor White

Write-Host ""
Write-Host "[*] Para reiniciar o Cursor:" -ForegroundColor Cyan
Write-Host "   1. Feche todas as janelas do Cursor" -ForegroundColor White
Write-Host "   2. Ou use: Get-Process Cursor | Stop-Process" -ForegroundColor White
Write-Host "   3. Abra o Cursor novamente" -ForegroundColor White


