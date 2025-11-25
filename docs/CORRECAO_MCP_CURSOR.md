# 🔧 Correção do Erro de Conexão MCP no Cursor

## 🔍 Problema Identificado

O servidor MCP `mcp-auto-memory` está tentando conectar ao **Ollama** e falhando, causando erros de conexão constantes no Cursor.

**Status do Health Check:**
- ✅ metadata: ok
- ✅ settings: ok  
- ✅ chromadb: ok
- ❌ **ollama: error** ← PROBLEMA
- ✅ buffer: ok

## ✅ Solução 1: Desabilitar Temporariamente o Ollama

Se você não precisa do Ollama, pode desabilitar temporariamente o servidor MCP que está causando problemas:

### Opção A: Comentar o servidor problemático

Edite o arquivo `C:\Users\vinic\.cursor\mcp.json` e comente o servidor `mcp-auto-memory`:

```json
{
  "mcpServers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": [
        "mcp",
        "gateway",
        "run"
      ],
      "env": {
        "LOCALAPPDATA": "C:\\Users\\vinic\\AppData\\Local",
        "ProgramData": "C:\\ProgramData",
        "ProgramFiles": "C:\\Program Files"
      }
    },
    "Playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest"
      ]
    }
    // Temporariamente desabilitado devido a erro de conexão com Ollama
    // "mcp-auto-memory": {
    //   "command": "node",
    //   "args": ["C:\\mcp\\mcp-auto-memory\\server.js"],
    //   "cwd": "C:\\mcp\\mcp-auto-memory"
    // }
  }
}
```

### Opção B: Adicionar tratamento de erros

Mantenha o servidor, mas adicione variáveis de ambiente para desabilitar o Ollama:

```json
{
  "mcpServers": {
    "mcp-auto-memory": {
      "command": "node",
      "args": ["C:\\mcp\\mcp-auto-memory\\server.js"],
      "cwd": "C:\\mcp\\mcp-auto-memory",
      "env": {
        "DISABLE_OLLAMA": "true"
      }
    }
  }
}
```

## ✅ Solução 2: Instalar/Corrigir o Ollama

Se você precisa do Ollama:

1. **Instalar Ollama:**
   ```powershell
   # Baixe de https://ollama.ai/download
   # Ou use winget:
   winget install Ollama.Ollama
   ```

2. **Iniciar o Ollama:**
   ```powershell
   ollama serve
   ```

3. **Verificar se está rodando:**
   ```powershell
   curl http://localhost:11434/api/tags
   ```

## ✅ Solução 3: Modificar o Servidor MCP

Se você tem acesso ao código do servidor `mcp-auto-memory`, adicione tratamento de erros para que falhas do Ollama não causem erros no Cursor:

```javascript
// No arquivo server.js, adicione tratamento de erros:
try {
  // Código de conexão com Ollama
} catch (error) {
  console.warn('Ollama não disponível, continuando sem ele');
  // Continue sem Ollama
}
```

## 🚀 Aplicar a Correção

1. **Feche o Cursor completamente**
2. **Edite o arquivo** `C:\Users\vinic\.cursor\mcp.json`
3. **Aplique uma das soluções acima**
4. **Salve o arquivo**
5. **Abra o Cursor novamente**

## 📝 Verificar se Funcionou

Após aplicar a correção, verifique:

1. O erro de conexão não aparece mais
2. O Cursor funciona normalmente
3. As funcionalidades MCP que você precisa ainda funcionam

## ⚠️ Nota

Se você desabilitar o `mcp-auto-memory`, perderá algumas funcionalidades de memória automática, mas o Cursor continuará funcionando normalmente para desenvolvimento.

