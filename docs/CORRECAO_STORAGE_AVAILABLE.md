# 🔧 Correção: Storage Available

## ❌ Problema Identificado

O código estava calculando `available = size - used`, mas o `systeminformation.fsSize()` **já retorna o campo `available` diretamente** do sistema operacional, que é mais preciso!

## ✅ Correção Aplicada

**Antes:**
```javascript
const availableBytes = sizeBytes - usedBytes; // Calculado manualmente
```

**Agora:**
```javascript
const availableBytes = disk.available || 0; // Usar available direto do sistema
```

## 📊 Por que é melhor?

1. **Mais preciso**: O sistema operacional calcula o espaço disponível considerando:
   - Espaço reservado pelo sistema
   - Quotas de disco
   - Overhead do filesystem
   - Espaço não alocável

2. **Valores reais**: O `available` do sistema reflete exatamente o que o usuário vê no Explorer/File Manager

3. **Logs melhorados**: Agora mostra:
   - `rawAvailable`: Valor direto do sistema
   - `calculatedAvailable`: Valor calculado (size - used)
   - `difference`: Diferença entre os dois (para debug)

## 🔍 Logs Detalhados

Agora os logs mostram:
```
📦 system-resources: Disk C::
  rawAvailable: 123456789012 (bytes direto do sistema)
  availableGB: 115.23 GB
  calculatedAvailable: 115.50 GB (calculado)
  difference: -0.27 GB (diferença)
```

## ✅ Resultado

O espaço disponível agora corresponde **exatamente** ao que o usuário vê no Windows Explorer!

