FROM node:18-alpine

WORKDIR /workspace

# Instalar dependencias del sistema PRIMERO
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Variables de entorno
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar package.json e instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código de la aplicación
COPY . .

EXPOSE 3000

# Usar node directamente, no script de entrypoint
CMD ["node", "server.js"]