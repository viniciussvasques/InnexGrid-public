# 🦊 MetaMask no Electron - Guia de Configuração

## 📋 Como Funciona

O Electron pode carregar extensões do Chrome, incluindo o MetaMask. Isso permite usar MetaMask diretamente no app desktop.

---

## 🔧 Configuração Automática

O app tenta carregar automaticamente o MetaMask se estiver instalado no Chrome.

### Caminhos Padrão

**Windows:**
```
%LOCALAPPDATA%\Google\Chrome\User Data\Default\Extensions\nkbihfbeogaeaoehlefnkodbefgpgknn
```

**macOS:**
```
~/Library/Application Support/Google/Chrome/Default/Extensions/nkbihfbeogaeaoehlefnkodbefgpgknn
```

**Linux:**
```
~/.config/google-chrome/Default/Extensions/nkbihfbeogaeaoehlefnkodbefgpgknn
```

---

## ✅ Pré-requisitos

1. **Chrome instalado** no sistema
2. **MetaMask instalado** como extensão do Chrome
3. **MetaMask configurado** com pelo menos uma conta

---

## 🧪 Como Testar

### 1. Instalar MetaMask no Chrome

1. Abra o Chrome
2. Vá para Chrome Web Store
3. Instale a extensão MetaMask
4. Configure uma conta (ou importe uma existente)

### 2. Iniciar o App Desktop

```bash
cd desktop
npm run dev:electron
```

### 3. Verificar se MetaMask Carregou

No console do Electron (DevTools), você deve ver:
```
📦 MetaMask encontrado, carregando extensão...
✅ MetaMask carregado com sucesso!
```

### 4. Conectar Wallet

No frontend do app:
1. Clique em "Conectar Wallet"
2. MetaMask deve aparecer como opção
3. Conecte normalmente

---

## 🐛 Troubleshooting

### MetaMask não aparece

**Causa**: MetaMask não está instalado no Chrome ou não está no caminho padrão.

**Solução**:
1. Instale MetaMask no Chrome primeiro
2. Verifique se está no caminho padrão
3. Reinicie o app desktop

### Erro ao carregar extensão

**Causa**: Caminho do MetaMask não encontrado.

**Solução**:
- O app continuará funcionando sem MetaMask
- Usuário pode usar WalletConnect ou outras opções
- Ou instalar MetaMask manualmente

### MetaMask aparece mas não conecta

**Causa**: Configuração de rede ou permissões.

**Solução**:
1. Verifique se a rede está configurada no MetaMask
2. Verifique se o app tem permissões necessárias
3. Tente reconectar

---

## 🔄 Alternativas

Se MetaMask não funcionar no Electron:

### 1. WalletConnect
- Conectar com MetaMask mobile via QR code
- Funciona sem extensões

### 2. MetaMask Desktop
- Versão standalone do MetaMask
- Pode ser integrada via IPC

### 3. Injeção Manual
- Detectar MetaMask instalado no sistema
- Injetar provider manualmente

---

## 📝 Notas

- **Desenvolvimento**: MetaMask é carregado automaticamente se encontrado
- **Produção**: Usuário precisa ter MetaMask instalado no Chrome
- **Fallback**: App funciona sem MetaMask (outras opções de wallet)

---

## ✅ Status

- [x] Detecção automática do MetaMask
- [x] Carregamento de extensão
- [x] Integração com Wagmi
- [ ] Teste manual realizado

---

**Instale MetaMask no Chrome e teste novamente!** 🚀

