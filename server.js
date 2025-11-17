// server.js - VERSIÓN CORREGIDA
const { execSync } = require('child_process');
const fs = require('fs');

// ==================== INSTALACIÓN SEGURA ====================
console.log('🔧 INICIANDO SERVIDOR...');

function safeRequire(moduleName) {
    try {
        console.log(`📦 Cargando: ${moduleName}`);
        return require(moduleName);
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log(`⚠️ Módulo ${moduleName} no encontrado, instalando...`);
            try {
                execSync(`npm install ${moduleName} --no-save`, { stdio: 'inherit' });
                console.log(`✅ ${moduleName} instalado`);
                return require(moduleName);
            } catch (installError) {
                console.error(`💥 Error instalando ${moduleName}:`, installError);
                // NO usar process.exit() - dejar que el servidor continúe
                return null;
            }
        }
        throw error;
    }
}

// Cargar módulos de forma segura
const express = safeRequire('express');
const cors = safeRequire('cors');
const puppeteer = safeRequire('puppeteer');

if (!express) {
    console.log('🚨 Express no disponible - instalando todas las dependencias...');
    try {
        execSync('npm install express cors puppeteer --production', { stdio: 'inherit' });
        console.log('✅ Todas las dependencias instaladas');
    } catch (error) {
        console.error('💥 Error crítico:', error);
    }
}

// Re-cargar módulos después de instalación
const expressFinal = require('express');
const corsFinal = require('cors'); 
const puppeteerFinal = require('puppeteer');

console.log('✅ MÓDULOS CARGADOS CORRECTAMENTE');

// ==================== CONFIGURACIÓN EXPRESS ====================
const app = expressFinal();
const PORT = process.env.PORT || 3000;

// CORS
app.use(corsFinal({
    origin: ['https://ciber7erroristaschk.com', 'http://localhost:3000', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.options('*', corsFinal());
app.use(expressFinal.json());

// ==================== HEALTH CHECKS ====================
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Servidor activo con 8GB RAM'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        resources: '8 vCPU / 8192 MB'
    });
});

// ==================== CACHE NAVEGADOR ====================
let cachedBrowserPath = null;

async function findBrowser() {
    if (cachedBrowserPath !== null) {
        console.log(`✅ Usando navegador cacheado en: ${cachedBrowserPath}`);
        return cachedBrowserPath;
    }

    const paths = [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser', 
        '/usr/lib/chromium/chromium',
        '/usr/lib/chromium/chrome'
    ];
    
    console.log('🔍 Buscando navegador...');
    
    for (const path of paths) {
        try {
            if (fs.existsSync(path)) {
                const stats = fs.statSync(path);
                if (stats.isFile() && (stats.mode & fs.constants.X_OK)) {
                    console.log(`✅ Navegador encontrado en: ${path}`);
                    cachedBrowserPath = path;
                    return path;
                }
            }
        } catch (error) {
            // Silenciar errores
        }
    }
    
    console.log('🔍 Usando búsqueda automática de Puppeteer...');
    cachedBrowserPath = undefined;
    return undefined;
}

// ==================== PUPPETEER OPTIMIZADO ====================
async function doPuppeteerSearch(bin) {
    let browser;
    
    try {
        const browserPath = await findBrowser();
        console.log('⏳ Iniciando Puppeteer OPTIMIZADO...');
        
        browser = await puppeteerFinal.launch({
            executablePath: browserPath,
            headless: "new", 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run'
            ],
            timeout: 45000
        });

        const page = await browser.newPage();
        
        // LIMITAR recursos
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setDefaultNavigationTimeout(30000);
        await page.setDefaultTimeout(30000);

        // Navegar
        const chkUrl = process.env.CHK_URL;
        console.log('🌐 Navegando a:', chkUrl);
        
        await page.goto(chkUrl, { 
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Login
        console.log('🔑 Iniciando sesión...');
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        await page.type('input[type="email"]', process.env.CHK_EMAIL, { delay: 10 });
        await page.type('input[type="password"]', process.env.CHK_PASSWORD, { delay: 10 });
        
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
        ]);

        // Buscar BIN
        console.log('🎯 Buscando BIN:', bin);
        await page.waitForSelector('input[placeholder="Buscar por BIN de 6 dígitos..."]', { timeout: 5000 });
        await page.type('input[placeholder="Buscar por BIN de 6 dígitos..."]', bin, { delay: 10 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // Extraer datos
        const resultados = await page.evaluate(() => {
            const datos = [];
            const filas = document.querySelectorAll('table tbody tr');
            
            filas.forEach((fila) => {
                const texto = fila.textContent || fila.innerText;
                const regex = /\d{16}\|\d{2}\|\d{4}\|\d{3}/g;
                const matches = texto.match(regex);
                if (matches) datos.push(...matches);
            });
            
            return datos;
        });

        console.log(`✅ Puppeteer: ${resultados.length} tarjetas`);
        
        return {
            success: true, 
            count: resultados.length,
            data: resultados
        };

    } catch (error) {
        console.error('❌ Error en Puppeteer:', error);
        throw error;
    } finally {
        if (browser) await browser.close().catch(console.error);
    }
}

// ==================== RUTAS PRINCIPALES ====================
app.get('/', (req, res) => {
    res.json({ 
        message: '🎉 Extrapolador Backend API - CON 8GB RAM',
        status: '🟢 ONLINE',
        resources: '8 vCPU / 8192 MB',
        endpoints: {
            health: '/api/health (GET)',
            search: '/api/search-bin (POST)',
            test: '/api/test-puppeteer (GET)'
        }
    });
});

app.post('/api/search-bin', async (req, res) => {
    const { bin } = req.body;
    
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener exactamente 6 dígitos' });
    }

    console.log(`🔍 Búsqueda para BIN: ${bin}`);
    
    try {
        const result = await doPuppeteerSearch(bin);
        res.json({
            ...result,
            source: 'puppeteer_8gb_ram'
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: `Error: ${error.message}`
        });
    }
});

app.get('/api/test-puppeteer', async (req, res) => {
    console.log('🧪 Probando Puppeteer...');
    let browser;
    try {
        const browserPath = await findBrowser();
        
        browser = await puppeteerFinal.launch({
            executablePath: browserPath,
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });
        
        const page = await browser.newPage();
        await page.goto('https://example.com', { timeout: 15000 });
        const title = await page.title();
        
        res.json({ 
            success: true, 
            message: '✅ Puppeteer FUNCIONA!',
            title: title
        });
    } catch (error) {
        console.error('❌ Error en test Puppeteer:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    } finally {
        if (browser) await browser.close();
    }
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎉 🎉 🎉 SERVIDOR ACTIVO en puerto ${PORT}`);
    console.log(`💪 RECURSOS: 8 vCPU / 8192 MB RAM`);
    console.log(`🔧 Health: http://0.0.0.0:${PORT}/health`);
    console.log(`🚀 Ready!`);
});

console.log('✅ SERVIDOR INICIADO CORRECTAMENTE');