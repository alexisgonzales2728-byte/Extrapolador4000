FROM node:18-alpine

WORKDIR /workspace

# Instalar solo lo esencial
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    # Eliminar ttf-freefont si no es crítico
    && rm -rf /var/cache/apk/*

# Variables de entorno para menos memoria
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_OPTIONS="--max-old-space-size=256"

COPY package*.json ./
RUN npm install --production && npm cache clean --force

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]