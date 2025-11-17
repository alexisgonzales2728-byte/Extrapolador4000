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

// Cache para la ruta del navegador
let cachedBrowserPath = null;

// Función para encontrar navegador automáticamente
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

// Puppeteer OPTIMIZADO para menos RAM
async function doPuppeteerSearch(bin) {
    let browser;
    
    try {
        const browserPath = await findBrowser();
        console.log('⏳ Iniciando Puppeteer OPTIMIZADO...');
        
        browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: "new", 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--single-process',
                '--no-zygote',
                '--max-old-space-size=128'
            ],
            timeout: 45000
        });

        const page = await browser.newPage();
        
        // LIMITAR recursos para ahorrar RAM
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
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 })
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

// Health check ACTUALIZADO
app.get('/api/health', (req, res) => {
    res.json({ 
        status: '✅ Backend funcionando con Puppeteer optimizado',
        timestamp: new Date().toISOString(),
        provider: 'Northflank + Puppeteer',
        message: 'Sistema optimizado para bajo consumo de RAM'
    });
});

// Ruta principal ACTUALIZADA
app.get('/', (req, res) => {
    res.json({ 
        message: 'Extrapolador Backend API - Puppeteer Optimizado',
        endpoints: {
            health: '/api/health (GET)',
            search: '/api/search-bin (POST) - Búsqueda principal',
            test: '/api/test-puppeteer (GET)'
        },
        status: '🟢 ONLINE OPTIMIZADO'
    });
});

// Ruta PRINCIPAL
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
            source: 'puppeteer_optimized'
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: `Error: ${error.message}`
        });
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

// Ruta debug Chromium
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

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
    console.log(`🔧 Modo: Puppeteer Optimizado (bajo consumo RAM)`);
});