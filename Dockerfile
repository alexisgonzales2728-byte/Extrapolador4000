FROM node:18-alpine

WORKDIR /workspace

# Instalar dependencias del sistema
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

# Copiar package.json
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install --production

# Copiar código
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]