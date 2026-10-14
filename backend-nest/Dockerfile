# ==========================================
# DOCKERFILE - BACKEND NESTJS (CAR WASH V3)
# ==========================================

# Etapa 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json tsconfig*.json ./

# Instalar dependencias completas para compilar
RUN npm ci

# Copiar código fuente
COPY src ./src

# Compilar proyecto TypeScript a JavaScript en dist/
RUN npm run build

# ==========================================
# Etapa 2: Imagen Ligera de Producción
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar artefactos compilados desde la etapa builder
COPY --from=builder /app/dist ./dist

# Puerto donde corre NestJS
EXPOSE 3000

# Comando de arranque
CMD ["node", "dist/main.js"]
