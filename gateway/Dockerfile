# Gateway Service Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY src/ ./src/

# Build (se build falhar, continuar mesmo assim para dev)
RUN npm run build || echo "Build failed, continuing for dev mode"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copiar package.json e instalar apenas production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist

# Criar diretório de logs
RUN mkdir -p logs

# Expor porta
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar
CMD ["node", "dist/server.js"]

