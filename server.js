const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS simplificado y efectivo
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Ruta de salud - DEBE funcionar
app.get('/api/health', (req, res) => {
    console.log('Health check recibido');
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
    console.log('Buscando BIN:', req.body.bin);
    
    const { bin } = req.body;
    
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener 6 dígitos' });
    }

    let browser;
    
    try {
        // Configurar Puppeteer para Render
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.setViewport({ width: 1366, height: 768 });

        // Navegar a ShadowChk - usando variable de entorno
        const shadowchkUrl = process.env.SHADOWCHK_URL || 'https://www.shadowchk.com/tools/card-storage';
        console.log('Navegando a:', shadowchkUrl);
        
        await page.goto(shadowchkUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Login con variables de entorno
        try {
            console.log('Intentando login...');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.type('input[type="email"]', process.env.SHADOWCHK_EMAIL);
            await page.type('input[type="password"]', process.env.SHADOWCHK_PASSWORD);
            
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
            console.log('Login exitoso');
        } catch (loginError) {
            console.log('Posiblemente ya logueado:', loginError.message);
        }

        // Buscar BIN
        console.log('Buscando BIN:', bin);
        await page.waitForSelector('input[placeholder="Buscar por BIN de 6 dígitos..."]', { timeout: 10000 });
        await page.type('input[placeholder="Buscar por BIN de 6 dígitos..."]', bin);
        await page.keyboard.press('Enter');
        
        // Esperar resultados
        console.log('Esperando resultados...');
        await page.waitForTimeout(5000);

        // Obtener datos REALES
        console.log('Extrayendo datos...');
        const resultados = await page.evaluate(() => {
            const filas = document.querySelectorAll('table tbody tr');
            const datos = [];
            
            filas.forEach(fila => {
                const texto = fila.innerText;
                // Buscar patrón: 16dígitos|2dígitos|4dígitos|3dígitos
                const regex = /\d{16}\|\d{2}\|\d{4}\|\d{3}/;
                const match = texto.match(regex);
                
                if (match) {
                    datos.push(match[0]);
                }
            });
            
            return datos;
        });

        console.log(`Encontradas ${resultados.length} tarjetas reales`);
        
        res.json({ 
            success: true, 
            count: resultados.length,
            data: resultados 
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📧 Email configurado: ${process.env.SHADOWCHK_EMAIL ? '✅' : '❌'}`);
    console.log(`🔑 Password configurado: ${process.env.SHADOWCHK_PASSWORD ? '✅' : '❌'}`);
    console.log(`🔗 URL configurada: ${process.env.SHADOWCHK_URL ? '✅' : '❌'}`);
    console.log(`🌐 CORS configurado para todos los dominios`);
});