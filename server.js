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
    
    // 1. Usar la ruta configurada por la variable de entorno (Dockerfile la define)
    const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (envPath && fs.existsSync(envPath)) {
        console.log(`✅ Navegador encontrado vía variable de entorno: ${envPath}`);
        return envPath;
    }
    
    // 2. Si no hay variable, buscar en rutas comunes (backup)
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
    console.error('   Variable PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
    return undefined;
}

// PUPPETEER CON MANEJO DE ERRORES MEJORADO
async function doPuppeteerSearch(bin) {
    let browser;
    
    try {
        console.log('⏳ Iniciando Puppeteer...');
        
const launchOptions = {
    headless: 'new', // El nuevo headless es menos detectable
    args: [
        // Argumentos básicos de seguridad/rendimiento
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-webgl',
        
        // === ARGUMENTOS CRÍTICOS ANTI-DETECCIÓN ===
        '--disable-blink-features=AutomationControlled', // Oculta la automatización
        '--disable-features=IsolateOrigins,site-per-process', // Reduce "huella"
        '--disable-web-security', // Permite ciertas solicitudes cruzadas
        '--disable-device-discovery-notifications',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-breakpad',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--password-store=basic',
        '--use-mock-keychain',
        '--force-device-scale-factor=1',
        '--disable-infobars'
    ],
    // Ocultar la bandera 'navigator.webdriver'
    ignoreDefaultArgs: ['--enable-automation'],
    // Forzar un viewport común
    defaultViewport: { 
        width: 1366, 
        height: 768,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
    },
    // Deshabilitar el caché del servicio (puede ser detectable)
    ignoreHTTPSErrors: true,
    // Tiempo de espera más largo para lanzamiento
    timeout: 60000,
    // Ruta del ejecutable (ya la tienes)
    executablePath: browserPath
};

        // SOLO agrega executablePath si findBrowser encontró uno
        if (browserPath) {
            launchOptions.executablePath = browserPath;
        } else {
            // Si findBrowser() retorna undefined, deja que Puppeteer use su lógica por defecto
            // (aunque con PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true, esto fallará)
            console.warn('⚠️  No se especificó ruta de navegador, Puppeteer usará su lógica por defecto.');
        }

        browser = await puppeteer.launch(launchOptions);
        console.log('✅ Puppeteer iniciado correctamente');

        const page = await browser.newPage();

        // === CONFIGURAR PÁGINA PARA SER MÁS HUMANA ===
console.log('👤 Configurando página para evitar detección...');

// 1. User-Agent realista (Windows + Chrome actual)
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

// 2. Configurar idioma y zona horaria
await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'language', { get: () => 'es-ES' });
    Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es', 'en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] }); // Fake plugins
    Object.defineProperty(navigator, 'webdriver', { get: () => false }); // CRÍTICO
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    
    // Timezone
    Object.defineProperty(Intl.DateTimeFormat.prototype.resolvedOptions, 'timeZone', {
        get: () => 'America/Mexico_City'
    });
});

// 3. Inyectar WebGL y Canvas fingerprint falso (importante)
await page.evaluateOnNewDocument(() => {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'NVIDIA Corporation'; // UNMASKED_VENDOR_WEBGL
        if (parameter === 37446) return 'NVIDIA GeForce GTX 1070'; // UNMASKED_RENDERER_WEBGL
        return getParameter.apply(this, arguments);
    };
    
    // Canvas fingerprinting
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (type === 'image/png') {
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        }
        return toDataURL.apply(this, arguments);
    };
});

// 4. Configurar headers extra
await page.setExtraHTTPHeaders({
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
});


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
await page.type('input[placeholder="Buscar por BIN de 6 dígitos..."]', bin, { delay: 500 });

// === ETAPA 1: Esperar a que la búsqueda SE INICIE (aparece "Cargando...") ===
console.log('⏳ Etapa 1: Esperando indicador de búsqueda iniciada...');
try {
    await page.waitForFunction(() => {
        const textoPagina = document.body.innerText || '';
        return textoPagina.includes('Cargando');
    }, { timeout: 5000 });
    console.log('✅ Búsqueda iniciada (apareció "Cargando...").');
} catch (error) {
    console.log('⚠️  No apareció "Cargando..." en 5s, continuando...');
}

// === ETAPA 2: ESPERA CRÍTICA de 15 segundos para que los datos CARGUEN ===
console.log('⏳ Etapa 2: Esperando 15 segundos PARA QUE CARGUEN LOS DATOS...');
await new Promise(resolve => setTimeout(resolve, 20000)); // 15.5 segundos

// === VERIFICAR que los datos están visibles ANTES de extraer ===
console.log('🔍 Verificando si hay datos reales...');
const hayDatosReales = await page.evaluate(() => {
    const filas = document.querySelectorAll('.protected-content table tbody tr');
    if (filas.length === 0) return false;
    
    // Verificar que al menos una fila tenga texto que parezca una tarjeta
    for (let fila of filas) {
        const texto = fila.textContent || '';
        if (/\d{16}.*\d{2}.*\d{4}.*\d{3}/.test(texto)) {
            return true;
        }
    }
    return false;
});

if (!hayDatosReales) {
    console.log('⚠️  Aún no hay datos después de 15s, esperando 5s más...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Tomar screenshot de diagnóstico
    const screenshotBuffer = await page.screenshot({ encoding: 'base64' });
    console.log('📸 Screenshot tras espera extra (pega en decoder):');
    console.log('data:image/png;base64,' + screenshotBuffer);
}

// === AHORA SÍ extraer (con el método robusto de HTML crudo) ===
console.log('🎯 Extrayendo datos...');
const htmlCrudo = await page.evaluate(() => {
    const contenedor = document.querySelector('.protected-content');
    return contenedor ? contenedor.innerHTML : document.body.innerHTML;
});

// Patrón flexible (acepta cualquier separador entre grupos)
const regexFlexible = /(\d{16}).*?(\d{2}).*?(\d{4}).*?(\d{3})/g;
let coincidencias = [];
let match;
while ((match = regexFlexible.exec(htmlCrudo)) !== null) {
    coincidencias.push(`${match[1]}|${match[2]}|${match[3]}|${match[4]}`);
}

// Si falla, intentar patrón con espacios/guiones
if (coincidencias.length === 0) {
    const regexTarjetaEspaciada = /(\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4})/g;
    const tarjetasEspaciadas = htmlCrudo.match(regexTarjetaEspaciada) || [];
    coincidencias = tarjetasEspaciadas.map(t => t.replace(/[- ]/g, '|'));
}

const resultados = [...new Set(coincidencias)];
console.log(`✅ Resultado final: ${resultados.length} tarjetas encontradas.`);
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