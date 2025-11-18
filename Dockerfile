FROM node:18-slim

# PASO 1: Actualizar sistema y instalar Chromium
RUN echo "🔧 PASO 1: Actualizando sistema e instalando Chromium..." && \
    apt-get update && \
    echo "📦 Paquetes disponibles:" && \
    apt-cache search chromium | head -5 && \
    apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    curl \
    wget \
    && echo "✅ Chromium instalado" && \
    which chromium && \
    chromium --version && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# PASO 2: Copiar package.json y verificar
COPY package*.json ./
RUN echo "📁 PASO 2: Contenido del directorio después de copiar package.json:" && \
    ls -la && \
    echo "📄 Contenido de package.json:" && \
    cat package.json && \
    echo "🔍 Verificando node y npm:" && \
    node --version && \
    npm --version

# PASO 3: Instalar dependencias con debug completo
RUN echo "📦 PASO 3: Instalando dependencias NPM..." && \
    npm config list && \
    echo "🔍 Registry config:" && \
    npm config get registry && \
    npm install --verbose --loglevel verbose && \
    echo "✅ Dependencias instaladas" && \
    echo "📁 Contenido de node_modules:" && \
    ls -la node_modules/ && \
    echo "🔍 Verificando módulos críticos:" && \
    ls node_modules/ | grep -E "express|cors|puppeteer" && \
    echo "🔍 Verificando express específicamente:" && \
    ls -la node_modules/express/ && \
    echo "🧪 Probando carga de módulos..." && \
    node -e "console.log('✅ Express:', require('express'))" && \
    node -e "console.log('✅ CORS:', require('cors'))" && \
    node -e "console.log('✅ Puppeteer:', require('puppeteer'))"

# PASO 4: Copiar el resto de la aplicación
COPY . .
RUN echo "📁 PASO 4: Contenido final del directorio:" && \
    ls -la && \
    echo "🔍 Verificando server.js:" && \
    ls -la server.js && \
    head -20 server.js

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# PASO 5: Verificación final antes del inicio
RUN echo "🔍 PASO 5: Verificación final del entorno:" && \
    echo "Chromium path:" && \
    which chromium && \
    echo "Node version:" && \
    node --version && \
    echo "Verificando que podemos requerir módulos..." && \
    node -e "const express = require('express'); const cors = require('cors'); console.log('✅ Todos los módulos cargan correctamente');"

EXPOSE 3000

# HEALTH CHECK para verificar que todo funciona
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Script de inicio con más debug
RUN echo "#!/bin/bash" > /app/start.sh && \
    echo "echo '🚀 INICIANDO APLICACIÓN...'" >> /app/start.sh && \
    echo "echo '📅 Fecha: \$(date)'" >> /app/start.sh && \
    echo "echo '📊 Memoria libre:' && free -h" >> /app/start.sh && \
    echo "echo '🔍 Última verificación de dependencias:'" >> /app/start.sh && \
    echo "ls -la node_modules/express/ 2>/dev/null && echo '✅ Express encontrado' || echo '❌ Express NO encontrado'" >> /app/start.sh && \
    echo "echo '🌐 Iniciando servidor en puerto 3000...'" >> /app/start.sh && \
    echo "node server.js" >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]