const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch'); 

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

// Health check ACTUALIZADO
app.get('/api/health', (req, res) => {
    res.json({ 
        status: '✅ Backend funcionando con ScrapingBee + Puppeteer',
        timestamp: new Date().toISOString(),
        provider: 'Northflank + ScrapingBee',
        message: 'Sistema híbrido activo'
    });
});

// Ruta principal ACTUALIZADA
app.get('/', (req, res) => {
    res.json({ 
        message: 'Extrapolador Backend API - Sistema Híbrido',
        endpoints: {
            health: '/api/health (GET)',
            search: '/api/search-bin (POST) - ScrapingBee',
            search_puppeteer: '/api/search-bin-puppeteer (POST) - Puppeteer local',
            test: '/api/test-puppeteer (GET)',
            test_scrapingbee: '/api/test-scrapingbee (GET)'
        },
        status: '🟢 ONLINE HÍBRIDO'
    });
});

// Ruta de prueba ScrapingBee
app.get('/api/test-scrapingbee', async (req, res) => {
    try {
        if (!process.env.SCRAPINGBEE_API_KEY) {
            return res.status(500).json({ error: 'SCRAPINGBEE_API_KEY no configurada' });
        }

        const scrapingbeeUrl = 'https://app.scrapingbee.com/api/v1/';
        const params = new URLSearchParams({
            'api_key': process.env.SCRAPINGBEE_API_KEY,
            'url': process.env.CHK_URL,
            'render_js': 'true',
            'js_scenario': JSON.stringify({
                "instructions": [
                    { "wait": 2000 },
                    { "fill": ["input[type='email']", process.env.CHK_EMAIL] },
                    { "fill": ["input[type='password']", process.env.CHK_PASSWORD] },
                    { "click": "button[type='submit']" },
                    { "wait": 3000 },
                    { "fill": ["input[placeholder*='BIN']", bin] },
                    { "wait": 1000 },
                    { "press_key": "Enter" },
                    { "wait": 4000 }
                ]
            }),
            'wait': '8000',
            'timeout': '30000'
        });

        console.log('🔄 Enviando request a ScrapingBee...');
        const response = await fetch(scrapingbeeUrl + '?' + params);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ScrapingBee HTTP ${response.status}: ${errorText}`);
        }

        const html = await response.text();
        console.log('✅ HTML recibido de ScrapingBee, longitud:', html.length);
        
        res.json({ 
            success: true, 
            count: resultados.length,
            data: resultados,
            source: 'scrapingbee',
            message: `Búsqueda completada para BIN: ${bin} (vía ScrapingBee)`
        });

    } catch (error) {
        console.error('❌ Error con ScrapingBee:', error.message);
        
        // FALLBACK a Puppeteer local
        console.log('🔄 Intentando fallback con Puppeteer local...');
        try {
            const fallbackResult = await doPuppeteerSearch(bin);
            res.json({
                ...fallbackResult,
                source: 'puppeteer_fallback',
                note: 'ScrapingBee falló, usando Puppeteer local'
            });
        } catch (fallbackError) {
            res.status(500).json({ 
                success: false, 
                error: `Ambos métodos fallaron: ${error.message}`,
                source: 'error'
            });
        }
    }
});

// Ruta de prueba Puppeteer (mantener igual)
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

// NUEVA RUTA: ScrapingBee (PRINCIPAL)
app.post('/api/search-bin', async (req, res) => {
    const { bin } = req.body;
    
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener exactamente 6 dígitos' });
    }

    console.log(`🔍 Búsqueda con ScrapingBee para BIN: ${bin}`);
    
    try {
        // Verificar que tenemos la API key
        if (!process.env.SCRAPINGBEE_API_KEY) {
            throw new Error('SCRAPINGBEE_API_KEY no configurada');
        }

        const scrapingbeeUrl = 'https://app.scrapingbee.com/api/v1/';
        
        // Configuración COMPLETA con custom JavaScript
        const params = new URLSearchParams({
            'api_key': process.env.SCRAPINGBEE_API_KEY,
            'url': process.env.CHK_URL, // Tu sitio
            'render_js': 'true',
            'custom_js': `
                // ScrapingBee ejecuta este JS en tu sitio
                console.log('🔑 Iniciando login automático...');
                
                // Esperar a que cargue la página
                setTimeout(() => {
                    // Llenar email
                    const emailInput = document.querySelector('input[type="email"]');
                    if (emailInput) {
                        emailInput.value = '${process.env.CHK_EMAIL}';
                    }
                    
                    // Llenar password
                    const passwordInput = document.querySelector('input[type="password"]');
                    if (passwordInput) {
                        passwordInput.value = '${process.env.CHK_PASSWORD}';
                    }
                    
                    // Hacer click en login
                    const loginButton = document.querySelector('button[type="submit"]');
                    if (loginButton) {
                        loginButton.click();
                    }
                    
                    // Después del login, buscar el BIN
                    setTimeout(() => {
                        const binInput = document.querySelector('input[placeholder*="BIN"]');
                        if (binInput) {
                            binInput.value = '${bin}';
                            binInput.dispatchEvent(new Event('input', { bubbles: true }));
                            
                            // Presionar Enter
                            setTimeout(() => {
                                const enterEvent = new KeyboardEvent('keydown', {
                                    key: 'Enter',
                                    code: 'Enter',
                                    keyCode: 13,
                                    which: 13,
                                    bubbles: true
                                });
                                binInput.dispatchEvent(enterEvent);
                            }, 1000);
                        }
                    }, 3000);
                    
                }, 2000);
            `,
            'wait': '8000', // Esperar 8 segundos para todo el proceso
            'timeout': '30000',
            'block_ads': 'true',
            'block_resources': 'false'
        });

        console.log('🔄 Enviando request a ScrapingBee...');
        const response = await fetch(scrapingbeeUrl + '?' + params);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ScrapingBee HTTP ${response.status}: ${errorText}`);
        }

        const html = await response.text();
        console.log('✅ HTML recibido de ScrapingBee, longitud:', html.length);
        
        // Extraer datos del HTML (usar tu misma lógica)
        const resultados = extractDataFromHTML(html);
        
        console.log(`✅ ScrapingBee: ${resultados.length} tarjetas encontradas`);
        
        res.json({ 
            success: true, 
            count: resultados.length,
            data: resultados,
            source: 'scrapingbee',
            message: `Búsqueda completada para BIN: ${bin} (vía ScrapingBee)`
        });

    } catch (error) {
        console.error('❌ Error con ScrapingBee:', error.message);
        
        // FALLBACK a Puppeteer local
        console.log('🔄 Intentando fallback con Puppeteer local...');
        try {
            const fallbackResult = await doPuppeteerSearch(bin);
            res.json({
                ...fallbackResult,
                source: 'puppeteer_fallback',
                note: 'ScrapingBee falló, usando Puppeteer local'
            });
        } catch (fallbackError) {
            res.status(500).json({ 
                success: false, 
                error: `Ambos métodos fallaron: ${error.message}`,
                source: 'error'
            });
        }
    }
});

// Función para extraer datos del HTML (MANTENER tu lógica actual)
function extractDataFromHTML(html) {
    const datos = [];
    
    // Usar regex para encontrar patrones de tarjetas (tu lógica actual)
    const regex = /\d{16}\|\d{2}\|\d{4}\|\d{3}/g;
    const matches = html.match(regex);
    
    if (matches) {
        datos.push(...matches);
    }
    
    // También buscar en tablas (como lo haces actualmente)
    // Puedes añadir más lógica de parsing aquí
    
    return datos;
}

// Función de fallback con Puppeteer (tu código actual)
async function doPuppeteerSearch(bin) {
    let browser;
    
    try {
        const browserPath = await findBrowser();
        console.log('⏳ Iniciando Puppeteer (fallback)...');
        
        browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: "new", 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--no-zygote',
                '--disable-gpu'
            ],
            timeout: 60000
        });
        
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);
        await page.setDefaultTimeout(60000);

        // Navegar al sitio
        const chkUrl = process.env.CHK_URL;
        console.log('🌐 Navegando a:', chkUrl);
        
        await page.goto(chkUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Login
        try {
            console.log('🔑 Iniciando sesión (fallback)...');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.type('input[type="email"]', process.env.CHK_EMAIL, { delay: 50 });
            await page.type('input[type="password"]', process.env.CHK_PASSWORD, { delay: 50 });
            
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 })
            ]);
            console.log('✅ Sesión iniciada (fallback)');
        } catch (loginError) {
            console.log('ℹ️  Sesión previa (fallback):', loginError.message);
        }

        // Buscar BIN
        console.log('🎯 Buscando BIN (fallback):', bin);
        await page.waitForSelector('input[placeholder="Buscar por BIN de 6 dígitos..."]', { timeout: 10000 });
        await page.type('input[placeholder="Buscar por BIN de 6 dígitos..."]', bin, { delay: 30 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);

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

        console.log(`✅ Puppeteer fallback: ${resultados.length} tarjetas`);
        
        return {
            success: true, 
            count: resultados.length,
            data: resultados
        };

    } catch (error) {
        console.error('❌ Error en fallback Puppeteer:', error);
        throw error;
    } finally {
        if (browser) await browser.close().catch(console.error);
    }
}

// Ruta Puppeteer original (mantener por compatibilidad)
app.post('/api/search-bin-puppeteer', async (req, res) => {
    const { bin } = req.body;
    
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener exactamente 6 dígitos' });
    }

    try {
        const result = await doPuppeteerSearch(bin);
        res.json({
            ...result,
            source: 'puppeteer_direct'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Error Puppeteer: ${error.message}` 
        });
    }
});

// Mantener las demás rutas existentes (debug, etc.)
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
            environment: process.env.PUPPETEER_EXECUTABLE_PATH,
            scrapingbee_key: process.env.SCRAPINGBEE_API_KEY ? '✅ Configurada' : '❌ No configurada'
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
    console.log(`🔧 Modo: Híbrido (ScrapingBee + Puppeteer fallback)`);
    console.log(`🌐 ScrapingBee: ${process.env.SCRAPINGBEE_API_KEY ? '✅ Configurado' : '❌ No configurado'}`);
});