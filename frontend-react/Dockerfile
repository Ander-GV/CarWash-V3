# ==========================================
# DOCKERFILE - FRONTEND REACT + NGINX
# ==========================================

# Etapa 1: Build de la aplicación React
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig*.json vite.config.ts ./
RUN npm ci

COPY index.html ./
COPY src ./src
COPY public ./public

# Compilar producción en dist/
RUN npm run build

# ==========================================
# Etapa 2: Servidor Nginx ultra ligero
# ==========================================
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar bundle compilado desde la etapa builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
