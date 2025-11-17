FROM node:18-alpine

WORKDIR /workspace

# Instalar Chromium y todas las librerías necesarias
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*

# Variables de Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar package.json e instalar dependencias
COPY package.json ./
RUN npm install

# Copiar código
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]