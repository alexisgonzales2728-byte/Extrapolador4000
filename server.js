// server.js - VERSIÓN COMPLETA CON MANEJO DE TIMEOUT
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

// Health checks
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Servidor activo - 8GB RAM'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        resources: '8 vCPU / 8192 MB'
    });
});

// Cache para navegador
let cachedBrowserPath = '/usr/bin/chromium'; // Forzar ruta específica

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
                '--single-process', // IMPORTANTE: Reduce memoria
                '--no-zygote',
                '--disable-features=VizDisplayCompositor'
            ],
            timeout: 60000
        });

        const page = await browser.newPage();
        
        // Configurar timeouts MÁS LARGOS
        await page.setDefaultNavigationTimeout(60000);
        await page.setDefaultTimeout(60000);
        
        // Configuración de rendimiento
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
            waitUntil: 'domcontentloaded', // MÁS RÁPIDO que networkidle0
            timeout: 45000
        });

        // Login con selectores FLEXIBLES
        console.log('🔑 Iniciando sesión...');
        
        // Esperar máximo 10 segundos por los campos
        await page.waitForSelector('input[type="email"], input[name="email"], #email', { 
            timeout: 10000 
        }).catch(() => {
            throw new Error('No se encontró el campo email después de 10 segundos');
        });

        // Usar evaluación para encontrar el campo email
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

        if (!emailField) {
            throw new Error('No se pudo encontrar el campo de email');
        }

        await page.type(emailField, process.env.CHK_EMAIL, { delay: 20 });

        // Encontrar campo password
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

        if (!passwordField) {
            throw new Error('No se pudo encontrar el campo de password');
        }

        await page.type(passwordField, process.env.CHK_PASSWORD, { delay: 20 });

        // Hacer click en el botón de login
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
            // Si no encuentra por texto, intentar con el primer botón submit
            const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
                submitBtn.click();
                return true;
            }
            return false;
        });

        if (!loginClicked) {
            throw new Error('No se pudo encontrar el botón de login');
        }

        // Esperar navegación O continuar después de timeout
        try {
            await page.waitForNavigation({ 
                waitUntil: 'domcontentloaded', 
                timeout: 15000 
            });
            console.log('✅ Navegación login completada');
        } catch (navError) {
            console.log('⚠️ Timeout navegación login, continuando...');
            // Continuar aunque falle la navegación
        }

        // Esperar a que cargue la página
        await page.waitForTimeout(3000);

        // Buscar BIN con selectores flexibles
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
            // Tomar screenshot para debug
            await page.screenshot({ path: '/tmp/debug-search.png' });
            throw new Error('No se encontró el campo de búsqueda BIN');
        }

        await page.type(searchField, bin, { delay: 20 });
        await page.keyboard.press('Enter');
        
        // Esperar resultados
        await page.waitForTimeout(4000);

        // Extraer datos
        const resultados = await page.evaluate(() => {
            const datos = [];
            
            // Múltiples formas de encontrar datos
            const selectors = [
                'table tbody tr',
                '.table tbody tr',
                'tr',
                '.row',
                '.item'
            ];
            
            for (const selector of selectors) {
                const filas = document.querySelectorAll(selector);
                if (filas.length > 0) {
                    filas.forEach((fila) => {
                        const texto = fila.textContent || fila.innerText;
                        const regex = /\d{16}\|\d{2}\|\d{4}\|\d{3}/g;
                        const matches = texto.match(regex);
                        if (matches) datos.push(...matches);
                    });
                    break; // Usar el primer selector que funcione
                }
            }
            
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
        
        // Tomar screenshot en caso de error
        try {
            await page.screenshot({ path: '/tmp/error-screenshot.png' });
            console.log('📸 Screenshot guardado en /tmp/error-screenshot.png');
        } catch (e) {
            console.log('No se pudo tomar screenshot del error');
        }
        
        throw error;
    } finally {
        if (browser) await browser.close().catch(console.error);
    }
}

// ==================== RUTAS PRINCIPALES ====================
app.get('/', (req, res) => {
    res.json({ 
        message: '🎉 Extrapolador Backend API - CON 8GB RAM',
        status: '🟢 ONLINE',
        resources: '8 vCPU / 8192 MB',
        endpoints: {
            health: '/api/health (GET)',
            search: '/api/search-bin (POST)',
            test: '/api/test-puppeteer (GET)'
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
        res.json({
            ...result,
            source: 'puppeteer_8gb_ram'
        });

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
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ],
            timeout: 30000
        });
        
        const page = await browser.newPage();
        await page.goto('https://example.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 20000 
        });
        const title = await page.title();
        
        res.json({ 
            success: true, 
            message: '✅ Puppeteer FUNCIONA!',
            title: title,
            resources: '8 vCPU / 8192 MB'
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

// Ruta para debug
app.get('/api/debug', (req, res) => {
    const fs = require('fs');
    const paths = [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
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
        browserPaths: results,
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
    console.log(`🔧 Health: http://0.0.0.0:${PORT}/health`);
    console.log(`🔧 Debug: http://0.0.0.0:${PORT}/api/debug`);
    console.log(`🚀 Ready para extrapolación!`);
});

// Manejo de graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recibido, cerrando...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT recibido, cerrando...');
    process.exit(0);
});