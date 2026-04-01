# Multi-stage Dockerfile para Tempos API
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json y lock
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm install --only=dev

# Copiar código fuente
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8080

# Solo instalar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=5 \
    CMD node -e "const http=require('http');const req=http.get('http://127.0.0.1:8080/health',res=>{res.resume();process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.setTimeout(8000,()=>{req.destroy();process.exit(1)});"

# Ejecutar
EXPOSE 8080
CMD ["node", "dist/index.js"]
