const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Todas las credenciales en variables de entorno
const SHADOWCHK_EMAIL = process.env.SHADOWCHK_EMAIL;
const SHADOWCHK_PASSWORD = process.env.SHADOWCHK_PASSWORD;
const SHADOWCHK_URL = process.env.SHADOWCHK_URL || 'https://www.shadowchk.com/tools/card-storage';

// Ruta para buscar BINs
app.post('/api/search-bin', async (req, res) => {
    const { bin } = req.body;
    
    console.log('Buscando BIN:', bin);
    
    if (!bin || bin.length !== 6) {
        return res.status(400).json({ error: 'BIN debe tener 6 dígitos' });
    }

    let browser;
    
    try {
        // Configurar Puppeteer
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

        // Navegar al sitio usando la variable de entorno
        console.log('Navegando a:', SHADOWCHK_URL);
        await page.goto(SHADOWCHK_URL, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Login
        try {
            console.log('Intentando login...');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.type('input[type="email"]', SHADOWCHK_EMAIL);
            await page.type('input[type="password"]', SHADOWCHK_PASSWORD);
            
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
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
        await page.waitForTimeout(4000);

        // Obtener datos
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

        console.log(`Encontradas ${resultados.length} tarjetas`);
        
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

// Ruta de salud
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
        environment: 'Render',
        endpoints: {
            health: '/api/health',
            search: '/api/search-bin (POST)'
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📧 Email configurado: ${SHADOWCHK_EMAIL ? '✅' : '❌'}`);
    console.log(`🔗 URL configurada: ${SHADOWCHK_URL ? '✅' : '❌'}`);
});