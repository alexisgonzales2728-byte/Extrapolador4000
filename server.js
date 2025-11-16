const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: '✅ Backend funcionando',
        timestamp: new Date().toISOString(),
        environment: 'Render'
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.json({ 
        message: 'Extrapolador Backend API',
        endpoints: {
            health: '/api/health',
            search: '/api/search-bin (POST)'
        }
    });
});

// Ruta REAL para buscar BINs
app.post('/api/search-bin', async (req, res) => {
    console.log('🔍 Búsqueda iniciada para BIN:', req.body.bin);
    
    const { bin } = req.body;
    
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener 6 dígitos' });
    }

    let browser;
    
    try {
        // Configuración optimizada para Render
        const launchOptions = {
            executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--single-process',
                '--memory-pressure-off',
                '--max-old-space-size=512'
            ],
            timeout: 30000
        };

        console.log('🚀 Iniciando navegador...');
        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();
        
        // Optimizar performance
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 720 });
        
        // Bloquear recursos innecesarios para mayor velocidad
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navegar a URL en variable de entorno
        const shadowchkUrl = process.env.SHADOWCHK_URL;
        console.log('🌐 Navegando a:', shadowchkUrl);
        
        await page.goto(shadowchkUrl, { 
            waitUntil: 'domcontentloaded', // Más rápido que networkidle2
            timeout: 30000 
        });

        // Login rápido
        try {
            console.log('🔑 Intentando login...');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.type('input[type="email"]', process.env.SHADOWCHK_EMAIL, { delay: 50 });
            await page.type('input[type="password"]', process.env.SHADOWCHK_PASSWORD, { delay: 50 });
            
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 })
            ]);
            console.log('✅ Login exitoso');
        } catch (loginError) {
            console.log('ℹ️  Posiblemente ya logueado:', loginError.message);
        }

        // Buscar BIN
        console.log('🎯 Buscando BIN:', bin);
        await page.waitForSelector('input[placeholder="Buscar por BIN de 6 dígitos..."]', { timeout: 10000 });
        await page.type('input[placeholder="Buscar por BIN de 6 dígitos..."]', bin, { delay: 30 });
        
        // Usar click en lugar de Enter para mayor confiabilidad
        const searchButton = await page.$('button[type="submit"], button:has-text("Buscar")');
        if (searchButton) {
            await Promise.all([
                searchButton.click(),
                page.waitForTimeout(3000) // Esperar resultados
            ]);
        } else {
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);
        }

        // Extraer datos REALES
        console.log('📊 Extrayendo datos...');
        const resultados = await page.evaluate(() => {
            const datos = [];
            const filas = document.querySelectorAll('table tbody tr');
            
            filas.forEach(fila => {
                const texto = fila.textContent || fila.innerText;
                
                // Buscar patrón: 16dígitos|MM|YYYY|CVV
                const regex = /\d{16}\|\d{2}\|\d{4}\|\d{3}/g;
                const matches = texto.match(regex);
                
                if (matches) {
                    datos.push(...matches);
                }
            });
            
            return datos;
        });

        console.log(`✅ Encontradas ${resultados.length} tarjetas reales`);
        
        res.json({ 
            success: true, 
            count: resultados.length,
            data: resultados 
        });

    } catch (error) {
        console.error('❌ Error en el scraping:', error);
        res.status(500).json({ 
            success: false, 
            error: `Error del servidor: ${error.message}` 
        });
    } finally {
        if (browser) {
            await browser.close().catch(e => console.log('⚠️  Error cerrando browser:', e));
        }
    }
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('💥 Error global:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
    console.log(`📧 Email: ${process.env.SHADOWCHK_EMAIL ? '✅' : '❌'}`);
    console.log(`🔑 Password: ${process.env.SHADOWCHK_PASSWORD ? '✅' : '❌'}`);
    console.log(`🌐 URL: ${process.env.SHADOWCHK_URL ? '✅' : '❌'}`);
});