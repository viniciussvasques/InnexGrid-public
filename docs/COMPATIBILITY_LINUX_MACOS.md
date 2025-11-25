# 🐧🍎 Compatibilidade Linux e macOS

## ✅ Status de Compatibilidade

### Windows ✅
- **Status:** Totalmente funcional
- **Testado:** Sim
- **Notas:** Funciona perfeitamente

### Linux 🐧
- **Status:** Funcional (requer testes)
- **Testado:** Parcialmente
- **Notas:** 
  - Requer `lscpu` e `df` instalados (padrão na maioria das distros)
  - Permissões podem ser necessárias para alguns comandos

### macOS 🍎
- **Status:** Funcional (requer testes)
- **Testado:** Parcialmente
- **Notas:**
  - Requer `sysctl` (já incluído no macOS)
  - Funciona nativamente

---

## 🔧 Comandos Utilizados por Plataforma

### Linux
```bash
# CPU Info
lscpu | grep "Model name"
lscpu | grep "CPU(s):"

# Storage Info
df -k /

# Todos os comandos são padrão e vêm pré-instalados
```

### macOS
```bash
# CPU Info
sysctl -n machdep.cpu.brand_string
sysctl -n hw.physicalcpu

# Storage Info
df -k /

# Todos os comandos são padrão do macOS
```

### Windows
```powershell
# CPU Info
wmic cpu get name
wmic cpu get NumberOfCores

# Storage Info
wmic logicaldisk get size,freespace,caption

# Todos os comandos são padrão do Windows
```

---

## 📦 Dependências

### Todas as Plataformas
- ✅ Node.js (já incluído no Electron)
- ✅ Electron (já incluído)
- ✅ Comandos nativos do sistema (já incluídos)

### Nenhuma dependência externa necessária!

---

## 🚀 Build para Linux e macOS

### Linux
```bash
cd desktop
npm run build:linux
# Gera: .deb (Debian/Ubuntu), .rpm (Fedora), AppImage (universal)
```

### macOS
```bash
cd desktop
npm run build:mac
# Gera: .dmg (instalador), .app (aplicativo)
```

### Windows
```bash
cd desktop
npm run build:win
# Gera: .exe (instalador), .msi (alternativa)
```

---

## 🧪 Testes Recomendados

### Linux
- [ ] Ubuntu 20.04+
- [ ] Debian 11+
- [ ] Fedora 35+
- [ ] Arch Linux

### macOS
- [ ] macOS 11 (Big Sur)+
- [ ] macOS 12 (Monterey)+
- [ ] macOS 13 (Ventura)+
- [ ] macOS 14 (Sonoma)+

---

## ⚠️ Problemas Conhecidos

### Linux
1. **Permissões**: Alguns comandos podem precisar de permissões elevadas
   - **Solução**: App funciona mesmo sem permissões (usa valores padrão)

2. **Distribuições diferentes**: Comandos podem variar
   - **Solução**: Código tem fallbacks para valores padrão

### macOS
1. **Gatekeeper**: Pode bloquear app não assinado
   - **Solução**: Usuário precisa permitir manualmente na primeira execução

2. **Notarização**: App precisa ser notarizado para distribuição
   - **Solução**: Usar certificado Apple Developer (pago)

---

## 🔒 Segurança

### Todas as Plataformas
- ✅ Context Isolation habilitado
- ✅ Node Integration desabilitado
- ✅ Remote Module desabilitado
- ✅ Web Security habilitado
- ✅ CSP configurado

---

## 📝 Notas de Implementação

### Detecção de Recursos
- ✅ Funciona em Windows, Linux e macOS
- ✅ Usa comandos nativos (sem dependências externas)
- ✅ Tem fallbacks caso comandos falhem
- ✅ Retorna valores padrão se não conseguir detectar

### Wallet Embutida
- ✅ Funciona em todas as plataformas
- ✅ Usa Web Crypto API (padrão do navegador)
- ✅ Criptografia AES-GCM (seguro)

### MetaMask
- ⚠️ Funciona apenas se MetaMask estiver instalado no Chrome
- ⚠️ Caminhos diferentes por plataforma (já implementado)

---

## ✅ Conclusão

O app é **compatível com Linux e macOS** e deve funcionar sem problemas adicionais. Os comandos utilizados são padrão e vêm pré-instalados em todas as plataformas.

**Próximos passos:**
1. Testar em máquinas Linux e macOS reais
2. Ajustar caminhos se necessário
3. Criar builds de distribuição

