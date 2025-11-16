const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

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
        status: '✅ Backend con Puppeteer funcionando',
        timestamp: new Date().toISOString(),
        provider: 'Northflank',
        message: 'Scraping REAL activo'
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.json({ 
        message: 'Extrapolador Backend API - Northflank',
        endpoints: {
            health: '/api/health (GET)',
            search: '/api/search-bin (POST)'
        },
        status: '🟢 ONLINE'
    });
});

// Ruta REAL para scraping
app.post('/api/search-bin', async (req, res) => {
    console.log('🔍 Búsqueda REAL iniciada para BIN:', req.body.bin);
    
    const { bin } = req.body;
    
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener exactamente 6 dígitos' });
    }

    let browser;
    
    try {
        // Configuración optimizada para Northflank
        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
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
                '--max-old-space-size=512'
            ],
            timeout: 30000
        });

        const page = await browser.newPage();
        
        // Optimizar performance
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 720 });
        
        // Bloquear recursos innecesarios
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navegar a  CHK
        const chkUrl = process.env.CHK_URL || 'https://www.shadowchk.com/tools/card-storage';
        console.log('🌐 Navegando a:', chkUrl);
        
        await page.goto(chkUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });

        // Login REAL
        try {
            console.log('🔑 Iniciando sesión...');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.type('input[type="email"]', process.env.CHK_EMAIL, { delay: 50 });
            await page.type('input[type="password"]', process.env.CHK_PASSWORD, { delay: 50 });
            
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 })
            ]);
            console.log('✅ Sesión iniciada correctamente');
        } catch (loginError) {
            console.log('ℹ️  Sesión previa detectada:', loginError.message);
        }

        // Buscar BIN
        console.log('🎯 Ejecutando búsqueda para BIN:', bin);
        await page.waitForSelector('input[placeholder="Buscar por BIN de 6 dígitos..."]', { timeout: 10000 });
        await page.type('input[placeholder="Buscar por BIN de 6 dígitos..."]', bin, { delay: 30 });
        
        // Usar Enter para buscar
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);

        // Extraer datos REALES del chk
        console.log('📊 Extrayendo datos de la tabla...');
        const resultados = await page.evaluate(() => {
            const datos = [];
            const filas = document.querySelectorAll('table tbody tr');
            
            filas.forEach((fila, index) => {
                const texto = fila.textContent || fila.innerText;
                
                // Buscar patrón específico de tarjetas
                const regex = /\d{16}\|\d{2}\|\d{4}\|\d{3}/g;
                const matches = texto.match(regex);
                
                if (matches) {
                    datos.push(...matches);
                }
            });
            
            return datos;
        });

        console.log(`✅ Extracción completada: ${resultados.length} tarjetas encontradas`);
        
        res.json({ 
            success: true, 
            count: resultados.length,
            data: resultados,
            message: `Búsqueda REAL completada para BIN: ${bin}`
        });

    } catch (error) {
        console.error('❌ Error en el proceso:', error);
        res.status(500).json({ 
            success: false, 
            error: `Error del servidor: ${error.message}`,
            tip: 'El servicio está en modo REAL. Verifica las credenciales.'
        });
    } finally {
        if (browser) {
            await browser.close().catch(e => console.log('⚠️  Error cerrando navegador:', e));
        }
    }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('💥 Error global no manejado:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'production' ? null : err.message
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Northflank ejecutándose en puerto ${PORT}`);
    console.log(`✅ Puppeteer: ACTIVO`);
    console.log(`🔗 Health: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
});