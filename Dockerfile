FROM node:18-alpine

WORKDIR /workspace

# Instalar Chromium y dependencias EXACTAS para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Configurar Puppeteer para usar Chromium del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Verificar que Chromium está instalado
RUN echo "Chromium version:" && chromium-browser --version

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código de la aplicación
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]