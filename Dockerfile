FROM node:18-alpine

WORKDIR /workspace

# Instalar Chromium Y DBUS
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dbus  # ← AÑADIR ESTO

    
# Configurar Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Iniciar DBUS (opcional - probar sin esto primero)
# RUN dbus-uuidgen > /var/lib/dbus/machine-id

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]