// server.js - VERSIÓN CON INSTALACIÓN AUTOMÁTICA
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 INICIANDO SERVIDOR - Node.js ' + process.version);

// ==================== INSTALACIÓN AUTOMÁTICA ====================
function installDependencies() {
    try {
        console.log('📦 Verificando dependencias...');
        
        // Verificar si node_modules existe
        if (!fs.existsSync('./node_modules/express')) {
            console.log('🔧 Dependencias faltantes - instalando...');
            
            // Crear package.json si no existe
            if (!fs.existsSync('./package.json')) {
                console.log('📄 Creando package.json...');
                const pkg = {
                    name: "extrapolador-backend",
                    version: "1.0.0",
                    main: "server.js",
                    scripts: { start: "node server.js" },
                    dependencies: {
                        "express": "^4.18.2",
                        "cors": "^2.8.5",
                        "puppeteer": "^21.11.0"
                    }
                };
                fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
            }
            
            // Instalar dependencias
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ Dependencias instaladas correctamente');
        } else {
            console.log('✅ Dependencias ya instaladas');
        }
    } catch (error) {
        console.error('❌ Error instalando dependencias:', error.message);
        console.log('🔄 Intentando instalación individual...');
        try {
            execSync('npm install express cors puppeteer --no-save', { stdio: 'inherit' });
        } catch (e) {
            console.error('💥 Error crítico:', e.message);
        }
    }
}

// Ejecutar instalación
installDependencies();

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
app.use(cors({
    origin: ['https://ciber7erroristaschk.com', 'http://localhost:3000', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.options('*', cors());
app.use(express.json());

// Health checks
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Servidor activo - 8GB RAM',
        node: process.version
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        resources: '8 vCPU / 8192 MB',
        node: process.version
    });
});

// Cache para navegador
let cachedBrowserPath = '/usr/bin/chromium';

// Puppeteer OPTIMIZADO - CON MANEJO MEJOR DE TIMEOUT
async function doPuppeteerSearch(bin) {
    let browser;
    
    try {
        console.log('⏳ Iniciando Puppeteer...');
        
        browser = await puppeteer.launch({
            executablePath: cachedBrowserPath,
            headless: "new", 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--single-process',
                '--no-zygote',
                '--disable-features=VizDisplayCompositor'
            ],
            timeout: 60000
        });

        const page = await browser.newPage();
        
        // Configurar timeouts MÁS LARGOS
        await page.setDefaultNavigationTimeout(60000);
        await page.setDefaultTimeout(60000);
        
        await page.setViewport({ width: 1280, height: 720 });

        // Interceptar recursos PESADOS
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navegar con waitUntil MÁS RÁPIDO
        const chkUrl = process.env.CHK_URL;
        console.log('🌐 Navegando a:', chkUrl);
        
        await page.goto(chkUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 45000
        });

        // Login con selectores FLEXIBLES
        console.log('🔑 Iniciando sesión...');
        
        await page.waitForSelector('input[type="email"], input[name="email"], #email', { 
            timeout: 10000 
        }).catch(() => {
            throw new Error('No se encontró el campo email después de 10 segundos');
        });

        const emailField = await page.evaluate(() => {
            const selectors = [
                'input[type="email"]',
                'input[name="email"]', 
                '#email',
                'input[placeholder*="email" i]',
                'input[placeholder*="correo" i]'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return selector;
            }
            return null;
        });

        if (!emailField) throw new Error('No se pudo encontrar el campo de email');
        await page.type(emailField, process.env.CHK_EMAIL, { delay: 20 });

        const passwordField = await page.evaluate(() => {
            const selectors = [
                'input[type="password"]',
                'input[name="password"]',
                '#password',
                'input[placeholder*="password" i]',
                'input[placeholder*="contraseña" i]'
            ];
            
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
                if (text.includes('login') || text.includes('iniciar') || text.includes('entrar') || 
                    text.includes('ingresar') || button.type === 'submit') {
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
            await page.waitForNavigation({ 
                waitUntil: 'domcontentloaded', 
                timeout: 15000 
            });
            console.log('✅ Navegación login completada');
        } catch (navError) {
            console.log('⚠️ Timeout navegación login, continuando...');
        }

        await page.waitForTimeout(3000);

        console.log('🎯 Buscando BIN:', bin);
        
        const searchField = await page.evaluate(() => {
            const selectors = [
                'input[placeholder*="BIN" i]',
                'input[placeholder*="buscar" i]',
                'input[name*="search" i]',
                'input[name*="bin" i]',
                'input[placeholder="Buscar por BIN de 6 dígitos..."]'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return selector;
            }
            return null;
        });

        if (!searchField) {
            await page.screenshot({ path: '/tmp/debug-search.png' });
            throw new Error('No se encontró el campo de búsqueda BIN');
        }

        await page.type(searchField, bin, { delay: 20 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);

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
        try {
            await page.screenshot({ path: '/tmp/error-screenshot.png' });
            console.log('📸 Screenshot guardado en /tmp/error-screenshot.png');
        } catch (e) {}
        throw error;
    } finally {
        if (browser) await browser.close().catch(console.error);
    }
}

// ==================== RUTAS PRINCIPALES ====================
app.get('/', (req, res) => {
    res.json({ 
        message: '🎉 Extrapolador Backend API - CON INSTALACIÓN AUTOMÁTICA',
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

    console.log(`🔍 Búsqueda para BIN: ${bin}`);
    
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
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium',
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            timeout: 30000
        });
        
        const page = await browser.newPage();
        await page.goto('https://example.com', { 
            waitUntil: 'domcontentloaded', timeout: 20000 
        });
        const title = await page.title();
        
        res.json({ 
            success: true, 
            message: '✅ Puppeteer FUNCIONA!',
            title: title,
            resources: '8 vCPU / 8192 MB'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.get('/api/debug', (req, res) => {
    const fs = require('fs');
    const paths = ['/usr/bin/chromium', '/usr/bin/chromium-browser'];
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
            CHK_PASSWORD: process.env.CHK_PASSWORD ? '✅ Configurado' : '❌ No configurado'
        }
    });
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎉 🎉 🎉 SERVIDOR ACTIVO en puerto ${PORT}`);
    console.log(`💪 RECURSOS: 8 vCPU / 8192 MB RAM`);
    console.log(`🔧 Node.js: ${process.version}`);
    console.log(`🚀 INSTALACIÓN AUTOMÁTICA ACTIVADA`);
});

console.log('✅ Servidor con instalación automática - LISTO!');