// server.js - VERSIÓN COMPLETA Y CORREGIDA
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 INICIANDO SERVIDOR - Node.js ' + process.version);

// ==================== INSTALACIÓN AUTOMÁTICA ====================
function installDependencies() {
    try {
        console.log('📦 Verificando dependencias...');
        
        if (!fs.existsSync('./node_modules/express')) {
            console.log('🔧 Dependencias faltantes - instalando...');
            
            if (!fs.existsSync('./package.json')) {
                console.log('📄 Creando package.json...');
                const pkg = {
                    name: "extrapolador-backend",
                    version: "1.0.0",
                    main: "server.js",
                    scripts: { 
                        start: "node server.js",
                        prestart: "npm install && npx puppeteer browsers install chrome",
                        postinstall: "npx puppeteer browsers install chrome || echo 'Chromium installation skipped'"
                    },
                    dependencies: {
                        "express": "^4.18.2",
                        "cors": "^2.8.5",
                        "puppeteer": "^21.6.1"
                    }
                };
                fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
            }
            
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ Dependencias instaladas correctamente');
        } else {
            console.log('✅ Dependencias ya instaladas');
        }
    } catch (error) {
        console.error('❌ Error instalando dependencias:', error.message);
        try {
            execSync('npm install express cors puppeteer --no-save', { stdio: 'inherit' });
        } catch (e) {
            console.error('💥 Error crítico:', e.message);
        }
    }
}

installDependencies();

// ==================== CONFIGURACIÓN PUPPETEER ====================
console.log('🔧 Configurando Puppeteer...');

// Buscar Chromium automáticamente en rutas comunes
function findChromium() {
    const possiblePaths = [
        '/home/heroku/.cache/puppeteer/chrome/linux-142.0.7444.162/chrome-linux64/chrome',
        '/home/heroku/.cache/puppeteer/chrome/linux-1069273/chrome-linux64/chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
    ];

    for (const path of possiblePaths) {
        try {
            if (fs.existsSync(path)) {
                console.log('✅ Chromium encontrado:', path);
                return path;
            }
        } catch (error) {
            continue;
        }
    }
    
    console.log('⚠️ Chromium no encontrado en rutas específicas, usando automático');
    return undefined;
}

const chromiumPath = findChromium();
if (chromiumPath) {
    process.env.PUPPETEER_EXECUTABLE_PATH = chromiumPath;
    console.log('🎯 Usando Chromium en:', chromiumPath);
} else {
    console.log('🔧 Puppeteer usará Chromium automático');
}

// ==================== CARGAR MÓDULOS ====================
console.log('🔧 Cargando módulos...');
let express, cors, puppeteer;

try {
    express = require('express');
    cors = require('cors');
    puppeteer = require('puppeteer');
    console.log('✅ Módulos cargados correctamente');
} catch (error) {
    console.error('❌ Error cargando módulos:', error.message);
    process.exit(1);
}

// ==================== CONFIGURACIÓN EXPRESS ====================
const app = express();
const PORT = process.env.PORT || 3000;

// CORS
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://ciber7erroristaschk.com',
            'https://www.ciber7erroristaschk.com',
            'http://localhost:3000',
            'http://127.0.0.1:5500',
            'https://p01--extrapolador-backend--zzznpgbh8lh8.code.run'
        ];
        
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('🚫 CORS bloqueado para origen:', origin);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ==================== PUPPETEER OPTIMIZADO ====================
async function doPuppeteerSearch(bin) {
    let browser;
    
    try {
        console.log('⏳ Iniciando Puppeteer...');
        
        const launchOptions = {
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--single-process',
                '--no-zygote'
            ],
            timeout: 60000
        };

        // Usar executablePath si está disponible
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        browser = await puppeteer.launch(launchOptions);
        console.log('✅ Puppeteer iniciado correctamente');

        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);
        await page.setDefaultTimeout(60000);
        await page.setViewport({ width: 1280, height: 720 });

        // Interceptar recursos
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navegar
        const chkUrl = process.env.CHK_URL;
        console.log('🌐 Navegando a:', chkUrl);
        
        await page.goto(chkUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 45000
        });

        console.log('🔑 Iniciando sesión...');
        
        // Login
        await page.waitForSelector('input[type="email"], input[name="email"], #email', { 
            timeout: 10000 
        }).catch(() => {
            throw new Error('No se encontró el campo email después de 10 segundos');
        });

        const emailField = await page.evaluate(() => {
            const selectors = ['input[type="email"]', 'input[name="email"]', '#email', 'input[placeholder*="email" i]', 'input[placeholder*="correo" i]'];
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return selector;
            }
            return null;
        });

        if (!emailField) throw new Error('No se pudo encontrar el campo de email');
        await page.type(emailField, process.env.CHK_EMAIL, { delay: 20 });

        const passwordField = await page.evaluate(() => {
            const selectors = ['input[type="password"]', 'input[name="password"]', '#password', 'input[placeholder*="password" i]', 'input[placeholder*="contraseña" i]'];
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return selector;
            }
            return null;
        });

        if (!passwordField) throw new Error('No se pudo encontrar el campo de password');
        await page.type(passwordField, process.env.CHK_PASSWORD, { delay: 20 });

        const loginClicked = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, input[type="submit"]');
            for (const button of buttons) {
                const text = button.textContent?.toLowerCase() || button.value?.toLowerCase() || '';
                if (text.includes('login') || text.includes('iniciar') || text.includes('entrar') || text.includes('ingresar') || button.type === 'submit') {
                    button.click();
                    return true;
                }
            }
            const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
                submitBtn.click();
                return true;
            }
            return false;
        });

        if (!loginClicked) throw new Error('No se pudo encontrar el botón de login');

        try {
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
            console.log('✅ Navegación login completada');
        } catch (navError) {
            console.log('⚠️ Timeout navegación login, continuando...');
        }

        await page.waitForTimeout(3000);

        console.log('🎯 Buscando BIN:', bin);
        
        const searchField = await page.evaluate(() => {
            const selectors = ['input[placeholder*="BIN" i]', 'input[placeholder*="buscar" i]', 'input[name*="search" i]', 'input[name*="bin" i]', 'input[placeholder="Buscar por BIN de 6 dígitos..."]'];
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return selector;
            }
            return null;
        });

        if (!searchField) throw new Error('No se encontró el campo de búsqueda BIN');
        await page.type(searchField, bin, { delay: 20 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);

        // Extraer datos
        const resultados = await page.evaluate(() => {
            const datos = [];
            const selectors = ['table tbody tr', '.table tbody tr', 'tr'];
            for (const selector of selectors) {
                const filas = document.querySelectorAll(selector);
                if (filas.length > 0) {
                    filas.forEach((fila) => {
                        const texto = fila.textContent || fila.innerText;
                        const regex = /\d{16}\|\d{2}\|\d{4}\|\d{3}/g;
                        const matches = texto.match(regex);
                        if (matches) datos.push(...matches);
                    });
                    break;
                }
            }
            return datos;
        });

        console.log(`✅ Puppeteer: ${resultados.length} tarjetas encontradas`);
        return { success: true, count: resultados.length, data: resultados };

    } catch (error) {
        console.error('❌ Error en Puppeteer:', error.message);
        throw error;
    } finally {
        if (browser) await browser.close().catch(console.error);
    }
}

// ==================== RUTAS PRINCIPALES ====================
app.get('/', (req, res) => {
    res.json({ 
        message: '🎉 Extrapolador Backend API - CONFIGURACIÓN PERMANENTE',
        status: '🟢 ONLINE', 
        node: process.version,
        resources: '8 vCPU / 8192 MB',
        endpoints: {
            health: '/api/health',
            search: '/api/search-bin (POST)',
            test: '/api/test-puppeteer',
            debug: '/api/debug'
        }
    });
});

app.post('/api/search-bin', async (req, res) => {
    const { bin } = req.body;
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener exactamente 6 dígitos' });
    }

    console.log(`🔍 Búsqueda para BIN: ${bin} desde origen: ${req.headers.origin}`);
    
    try {
        const result = await doPuppeteerSearch(bin);
        res.json({ ...result, source: 'puppeteer_8gb_ram' });
    } catch (error) {
        console.error('❌ Error en búsqueda:', error.message);
        res.status(500).json({ 
            success: false, 
            error: `Error: ${error.message}`,
            suggestion: 'Verifique la conexión y reintente'
        });
    }
});

app.get('/api/test-puppeteer', async (req, res) => {
    console.log('🧪 Probando Puppeteer...');
    let browser;
    try {
        const launchOptions = {
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            timeout: 30000
        };

        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
        const title = await page.title();
        
        res.json({ 
            success: true, 
            message: '✅ Puppeteer FUNCIONA!',
            title: title,
            chromium: process.env.PUPPETEER_EXECUTABLE_PATH ? 'Ruta específica' : 'Automático'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Health checks
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Servidor activo - Configuración permanente',
        node: process.version
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        resources: '8 vCPU / 8192 MB',
        node: process.version,
        chromium: process.env.PUPPETEER_EXECUTABLE_PATH ? 'Configurado' : 'Automático'
    });
});

app.get('/api/debug', (req, res) => {
    const paths = ['/home/heroku/.cache/puppeteer/chrome/linux-142.0.7444.162/chrome-linux64/chrome', '/usr/bin/chromium'];
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
        browserPaths: results,
        nodeVersion: process.version,
        environment: {
            CHK_URL: process.env.CHK_URL ? '✅ Configurado' : '❌ No configurado',
            CHK_EMAIL: process.env.CHK_EMAIL ? '✅ Configurado' : '❌ No configurado',
            CHK_PASSWORD: process.env.CHK_PASSWORD ? '✅ Configurado' : '❌ No configurado',
            PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || 'No configurado'
        }
    });
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎉 🎉 🎉 SERVIDOR ACTIVO en puerto ${PORT}`);
    console.log(`💪 RECURSOS: 8 vCPU / 8192 MB RAM`);
    console.log(`🔧 Node.js: ${process.version}`);
    console.log(`🌐 CORS: Configurado para producción`);
    console.log(`🦊 Puppeteer: ${process.env.PUPPETEER_EXECUTABLE_PATH ? 'Ruta específica' : 'Automático'}`);
    console.log(`🚀 CONFIGURACIÓN PERMANENTE ACTIVADA!`);
});

console.log('✅ Servidor con configuración permanente - LISTO!');