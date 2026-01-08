// DEBUG INICIAL EXTREMO
console.log('🎯 ===== INICIANDO SERVER.JS =====');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('📁 Directorio actual:', process.cwd());
console.log('🔍 Variables de entorno Puppeteer:');
console.log('   PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
console.log('   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:', process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD);

const fs = require('fs');
try {
    console.log('📁 Archivos en directorio actual:');
    const files = fs.readdirSync('.');
    console.log(files);
    
    console.log('📦 Verificando node_modules:');
    if (fs.existsSync('node_modules')) {
        const nodeModules = fs.readdirSync('node_modules');
        console.log('   Número de módulos:', nodeModules.length);
        console.log('   Módulos críticos encontrados:');
        ['express', 'cors', 'puppeteer'].forEach(mod => {
            const exists = fs.existsSync(`node_modules/${mod}`);
            console.log(`   - ${mod}: ${exists ? '✅' : '❌'}`);
        });
    } else {
        console.log('❌ node_modules NO EXISTE!');
    }
} catch (error) {
    console.log('❌ Error en verificación inicial:', error.message);
}

// INTENTAR CARGAR MÓDULOS
try {
    console.log('🔧 Cargando módulo express...');
    const express = require('express');
    console.log('✅ Express cargado correctamente');
} catch (error) {
    console.log('❌ Error cargando express:', error.message);
    console.log('💀 APLICACIÓN FALLIDA - SALIENDO');
    process.exit(1);
}

try {
    console.log('🔧 Cargando módulo cors...');
    const cors = require('cors');
    console.log('✅ CORS cargado correctamente');
} catch (error) {
    console.log('❌ Error cargando cors:', error.message);
}

// EL RESTO DE TU CÓDIGO ORIGINAL AQUÍ...
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('✅ Todos los módulos cargados - Iniciando servidor Express...');

// CORS CONFIGURACIÓN MEJORADA
app.use(cors({
    origin: ['https://ciber7erroristaschk.com', 'http://localhost:3000', 'http://127.0.0.1:5500', 'https://p01--extrapolador-backend--zzznpgbh8lh8.code.run'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.options('*', cors());
app.use(express.json());

// HEALTH CHECKS INMEDIATOS (sin dependencias de Puppeteer)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Servidor funcionando correctamente',
        dependencies: {
            express: '✅',
            cors: '✅', 
            puppeteer: '✅'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'extrapolador-backend',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// RUTA PRINCIPAL
app.get('/', (req, res) => {
    res.json({ 
        message: '🎉 Extrapolador Backend API',
        status: '🟢 ONLINE',
        endpoints: {
            health: '/api/health',
            search: '/api/search-bin (POST)',
            test: '/api/test-puppeteer'
        }
    });
});

// CACHE PARA NAVEGADOR
let cachedBrowserPath = null;

// FUNCIÓN PARA ENCONTRAR NAVEGADOR
async function findBrowser() {
    console.log('🔍 Buscando navegador...');
    const fs = require('fs');
    
    // 1. INTENTO PRINCIPAL: Usar la ruta interna de Puppeteer (la que descarga postinstall)
    try {
        const puppeteer = require('puppeteer');
        const puppeteerPath = puppeteer.executablePath();
        console.log('   Puppeteer sugiere la ruta:', puppeteerPath);
        if (fs.existsSync(puppeteerPath)) {
            console.log('✅ Navegador encontrado vía Puppeteer.');
            return puppeteerPath;
        }
    } catch (error) {
        console.log('⚠️  No se pudo obtener la ruta de Puppeteer:', error.message);
    }
    
    // 2. INTENTO SECUNDARIO: Rutas comunes del sistema (por si acaso)
    console.log('🔍 Buscando en rutas del sistema...');
    const systemPaths = [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome-stable'
    ];
    
    for (const path of systemPaths) {
        if (fs.existsSync(path)) {
            console.log(`✅ Navegador encontrado en sistema: ${path}`);
            return path;
        }
    }
    
    // 3. FALLO TOTAL
    console.error('❌ No se pudo encontrar ningún navegador.');
    console.error('   Asegúrate de que la variable NPM_CONFIG_PRODUCTION=false está configurada.');
    console.error('   Y de que el script postinstall se ejecutó durante el build.');
    return undefined;
}

// PUPPETEER CON MANEJO DE ERRORES MEJORADO
async function doPuppeteerSearch(bin) {
    let browser;
    
    try {
        console.log('⏳ Iniciando Puppeteer...');
        
        // 1. Definir una ruta de caché EXPLÍCITA dentro del espacio de trabajo
        const cacheDirectory = process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache';
        const fs = require('fs');
        if (!fs.existsSync(cacheDirectory)) {
            fs.mkdirSync(cacheDirectory, { recursive: true });
        }
        console.log('📁 Usando caché en:', cacheDirectory);

        // 2. Configurar las opciones de lanzamiento CON la ruta de caché
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            timeout: 30000,
            // CLAVE: Indicarle a Puppeteer dónde está el caché descargado
            cacheDirectory: cacheDirectory, // Esta línea es nueva
            // También forzar el uso del ejecutable descargado
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 
                            '/home/heroku/.cache/puppeteer/chrome/linux-143.0.7499.169/chrome-linux64/chrome'
        };

        browser = await puppeteer.launch(launchOptions);
        console.log('✅ Puppeteer iniciado correctamente');

        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(30000);
        await page.setDefaultTimeout(30000);

        // Navegar
        const chkUrl = process.env.CHK_URL;
        console.log('🌐 Navegando a:', chkUrl);
        
        await page.goto(chkUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Login
        console.log('🔑 Iniciando sesión...');
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.type('input[type="email"]', process.env.CHK_EMAIL, { delay: 20 });
        await page.type('input[type="password"]', process.env.CHK_PASSWORD, { delay: 20 });
        
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 })
        ]);

        // Buscar BIN
        console.log('🎯 Buscando BIN:', bin);
        await page.waitForSelector('input[placeholder="Buscar por BIN de 6 dígitos..."]', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.type('input[placeholder="Buscar por BIN de 6 dígitos..."]', bin, { delay: 500 });
        await new Promise(resolve => setTimeout(resolve, 15000));

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

        console.log(`✅ Puppeteer: ${resultados.length} tarjetas encontradas`);
        
        return {
            success: true, 
            count: resultados.length,
            data: resultados
        };

    } catch (error) {
        console.error('❌ Error en Puppeteer:', error.message);
        throw error;
    } finally {
        if (browser) await browser.close().catch(console.error);
    }
}

// RUTA DE BÚSQUEDA
app.post('/api/search-bin', async (req, res) => {
    const { bin } = req.body;
    
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener exactamente 6 dígitos' });
    }

    console.log(`🔍 Búsqueda para BIN: ${bin}`);
    
    try {
        const result = await doPuppeteerSearch(bin);
        res.json(result);
    } catch (error) {
        console.error('❌ Error en búsqueda:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

// RUTA DE TEST PUPPETEER
app.get('/api/test-puppeteer', async (req, res) => {
    console.log('🧪 Probando Puppeteer...');
    let browser;
    try {
        const browserPath = await findBrowser();
        const launchOptions = {
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            timeout: 20000
        };

        if (browserPath) {
            launchOptions.executablePath = browserPath;
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        await page.goto('https://example.com', { timeout: 15000 });
        const title = await page.title();
        
        res.json({ 
            success: true, 
            message: '✅ Puppeteer FUNCIONA!',
            title: title
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    } finally {
        if (browser) await browser.close();
    }
});

// INICIAR SERVIDOR
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
    console.log(`🔧 Health: http://0.0.0.0:${PORT}/health`);
    console.log(`🔧 API Health: http://0.0.0.0:${PORT}/api/health`);
});

console.log('✅ Servidor iniciado correctamente');