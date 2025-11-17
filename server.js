const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors({
    origin: ['https://ciber7erroristaschk.com', 'http://localhost:3000', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.options('*', cors());

app.use(express.json());

// Cache para la ruta del navegador (SOLO SE BUSCA UNA VEZ)
let cachedBrowserPath = null;

// Función para encontrar navegador automáticamente (OPTIMIZADA)
async function findBrowser() {
    if (cachedBrowserPath !== null) {
        console.log(`✅ Usando navegador cacheado en: ${cachedBrowserPath}`);
        return cachedBrowserPath;
    }

    const fs = require('fs');
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

// Health check (CORREGIDO - sin duplicado)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: '✅ Backend con Puppeteer funcionando',
        timestamp: new Date().toISOString(),
        provider: 'Northflank + Dockerfile',
        message: 'Scraping REAL activo con Chromium'
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.json({ 
        message: 'Extrapolador Backend API - Dockerfile',
        endpoints: {
            health: '/api/health (GET)',
            search: '/api/search-bin (POST)',
            test: '/api/test-puppeteer (GET)'
        },
        status: '🟢 ONLINE CON CHROMIUM'
    });
});

// Ruta de prueba Google instalado
app.get('/api/debug-chromium', (req, res) => {
    const fs = require('fs');
    
    try {
        const paths = [
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser', 
            '/usr/lib/chromium/chromium'
        ];
        
        const results = {};
        paths.forEach(path => {
            try {
                results[path] = {
                    exists: fs.existsSync(path),
                    executable: fs.existsSync(path) ? (fs.statSync(path).mode & fs.constants.X_OK) !== 0 : false
                };
            } catch (e) {
                results[path] = { error: e.message };
            }
        });
        
        res.json({ 
            paths: results,
            cachedPath: cachedBrowserPath,
            environment: process.env.PUPPETEER_EXECUTABLE_PATH
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta de prueba Puppeteer
app.get('/api/test-puppeteer', async (req, res) => {
    console.log('🧪 Probando Puppeteer...');
    let browser;
    try {
        const browserPath = await findBrowser();
        
        browser = await puppeteer.launch({
            executablePath: browserPath,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
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

// Manejar OPTIONS explícitamente
app.options('/api/search-bin', (req, res) => {
    console.log('🔵 OPTIONS /api/search-bin - Preflight CORS');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
});

// Ruta REAL para scraping (OPTIMIZADA)
app.post('/api/search-bin', async (req, res) => {
    console.log('🔍 Búsqueda para BIN:', req.body.bin);
    
    const { bin } = req.body;
    
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener exactamente 6 dígitos' });
    }

    let browser;
    
    try {
        const browserPath = await findBrowser();
        console.log('⏳ Iniciando Puppeteer (puede tomar hasta 5 minutos)...');
        browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: "new", 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--single-process',
                '--max-old-space-size=64',  // ← MÁS BAJO
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-translate'
            ],
            protocolTimeout: 180000,
            timeout: 180000         
        });

        console.log('✅ Puppeteer iniciado después de espera larga');

        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);
        await page.setDefaultTimeout(60000);

        // COMENTADO TEMPORALMENTE - User Agent personalizado
        // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Navegar con waitUntil más simple
        const chkUrl = process.env.CHK_URL;
        console.log('🌐 Navegando a:', chkUrl);
        
        await page.goto(chkUrl, { 
            waitUntil: 'domcontentloaded',  // MÁS RÁPIDO
            timeout: 60000
        });
        // Login
        try {
            console.log('🔑 Iniciando sesión...');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.type('input[type="email"]', process.env.CHK_EMAIL, { delay: 50 });
            await page.type('input[type="password"]', process.env.CHK_PASSWORD, { delay: 50 });
            
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 })
            ]);
            console.log('✅ Sesión iniciada');
        } catch (loginError) {
            console.log('ℹ️  Sesión previa:', loginError.message);
        }

        // Buscar BIN
        console.log('🎯 Buscando BIN:', bin);
        await page.waitForSelector('input[placeholder="Buscar por BIN de 6 dígitos..."]', { timeout: 10000 });
        await page.type('input[placeholder="Buscar por BIN de 6 dígitos..."]', bin, { delay: 30 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);

        // Extraer datos
        console.log('📊 Extrayendo datos...');
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

        console.log(`✅ Extracción: ${resultados.length} tarjetas`);
        
        res.json({ 
            success: true, 
            count: resultados.length,
            data: resultados,
            message: `Búsqueda completada para BIN: ${bin}`
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            success: false, 
            error: `Error: ${error.message}`
        });
    } finally {
        if (browser) await browser.close().catch(console.error);
    }
});

// Ruta GET informativa
app.get('/api/search-bin', (req, res) => {
    res.status(405).json({ 
        error: 'Método incorrecto',
        message: 'Usa POST en lugar de GET',
        ejemplo: 'curl -X POST https://p01--extrapolador-backend--zzznpgbh8lh8.code.run/api/search-bin -H "Content-Type: application/json" -d \'{"bin":"426807"}\''
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});