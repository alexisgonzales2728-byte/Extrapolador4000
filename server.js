console.log('🟢 INICIANDO SERVER - FASE 1: Cargando módulos...');

try {
    const express = require('express');
    console.log('✅ Express cargado');
    const cors = require('cors');
    console.log('✅ CORS cargado');
    const puppeteer = require('puppeteer');
    console.log('✅ Puppeteer cargado');
} catch (error) {
    console.log('❌ ERROR cargando módulos:', error.message);
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🟢 FASE 2: Configurando middleware...');

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

console.log('✅ Middleware configurado');

// Health check con más info
app.get('/api/health', (req, res) => {
    console.log('🔍 Health check ejecutado');
    res.json({ 
        status: '✅ Backend funcionando',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        puppeteer: 'ACTIVO',
        memory: process.memoryUsage(),
        uptime: process.uptime()
    });
});

// Ruta principal
app.get('/', (req, res) => {
    console.log('📦 Ruta raíz accedida');
    res.json({ 
        message: 'Extrapolador Backend API - Northflank',
        endpoints: {
            health: '/api/health (GET)',
            search: '/api/search-bin (POST)'
        },
        status: '🟢 ONLINE',
        debug: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            envVariables: {
                CHK_URL: process.env.CHK_URL ? 'SET' : 'MISSING',
                CHK_EMAIL: process.env.CHK_EMAIL ? 'SET' : 'MISSING', 
                CHK_PASSWORD: process.env.CHK_PASSWORD ? 'SET' : 'MISSING'
            }
        }
    });
});

// Ruta TEST simplificada
app.post('/api/test-puppeteer', async (req, res) => {
    console.log('🧪 TEST Puppeteer iniciado');
    
    let browser;
    try {
        console.log('🔄 1. Iniciando Puppeteer...');
        
        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ],
            timeout: 15000
        });

        console.log('✅ 2. Puppeteer iniciado correctamente');
        
        const page = await browser.newPage();
        console.log('✅ 3. Nueva página creada');
        
        await page.goto('https://httpbin.org/html', { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
        });
        
        console.log('✅ 4. Navegación completada');
        
        const title = await page.title();
        console.log('✅ 5. Título obtenido:', title);
        
        res.json({ 
            success: true, 
            message: '🧪 TEST EXITOSO - Puppeteer funciona',
            title: title,
            steps: [
                'Puppeteer iniciado',
                'Página creada', 
                'Navegación exitosa',
                'Título obtenido'
            ]
        });

    } catch (error) {
        console.error('❌ ERROR en test Puppeteer:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack,
            step: 'Revisar en qué paso falló'
        });
    } finally {
        if (browser) {
            await browser.close().catch(e => console.log('⚠️  Error cerrando navegador:', e));
            console.log('🔒 Navegador cerrado');
        }
    }
});

// Ruta REAL para scraping (versión debug)
app.post('/api/search-bin', async (req, res) => {
    console.log('🔍 Búsqueda REAL iniciada para BIN:', req.body?.bin);
    console.log('📦 Body completo:', req.body);
    
    const { bin } = req.body;
    
    if (!bin || bin.length !== 6) {
        console.log('❌ BIN inválido:', bin);
        return res.status(400).json({ error: 'BIN debe tener exactamente 6 dígitos' });
    }

    let browser;
    
    try {
        console.log('🔄 PASO 1: Iniciando Puppeteer...');
        
        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ],
            timeout: 30000
        });

        console.log('✅ PASO 1: Puppeteer iniciado');

        const page = await browser.newPage();
        console.log('✅ PASO 2: Nueva página creada');
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        console.log('✅ PASO 3: User Agent configurado');

        const chkUrl = process.env.CHK_URL;
        console.log('🌐 PASO 4: Navegando a:', chkUrl);
        
        await page.goto(chkUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });

        console.log('✅ PASO 4: Navegación completada');
        console.log('📄 URL actual:', page.url());

        // SIMULAMOS EXTRACCIÓN POR AHORA
        console.log('🎯 PASO 5: Simulando extracción...');
        await page.waitForTimeout(2000);
        
        res.json({ 
            success: true, 
            count: 0,
            data: [],
            message: `Búsqueda en modo DEBUG para BIN: ${bin}`,
            debug: {
                stepsCompleted: [
                    'Puppeteer iniciado',
                    'Página creada',
                    'Navegación completada', 
                    'Extracción simulada'
                ],
                url: chkUrl,
                env: {
                    CHK_EMAIL: process.env.CHK_EMAIL ? 'SET' : 'MISSING',
                    CHK_PASSWORD: process.env.CHK_PASSWORD ? 'SET' : 'MISSING'
                }
            }
        });

    } catch (error) {
        console.error('❌ ERROR CRÍTICO en búsqueda:');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        console.error('En paso:', error.step || 'desconocido');
        
        res.status(500).json({ 
            success: false, 
            error: `Error: ${error.message}`,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
            step: 'Verificar logs para detalles completos'
        });
    } finally {
        if (browser) {
            await browser.close().catch(e => console.log('⚠️  Error cerrando navegador:', e));
            console.log('🔒 Navegador cerrado en finally');
        }
    }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    console.log('❌ Ruta no encontrada:', req.originalUrl);
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        availableEndpoints: ['/', '/api/health', '/api/test-puppeteer', '/api/search-bin']
    });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('💥 ERROR GLOBAL NO MANEJADO:');
    console.error(err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'production' ? null : err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

console.log('🟢 FASE 3: Iniciando servidor...');

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVERSERVER INICIADO CORRECTAMENTE`);
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌐 Host: 0.0.0.0`);
    console.log(`🔗 Health: http://0.0.0.0:${PORT}/api/health`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🧠 Node.js: ${process.version}`);
    console.log(`📦 Dependencias: Express, CORS, Puppeteer ✅`);
    console.log('=' .repeat(50));
});

console.log('🟢 FASE 4: Server.js cargado completamente');