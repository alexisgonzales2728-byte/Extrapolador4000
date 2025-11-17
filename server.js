console.log('🔴 DEBUG: Iniciando aplicación...');

// Verificar variables de entorno críticas
console.log('🔴 DEBUG: Variables de entorno:');
console.log('- PORT:', process.env.PORT || 3000);
console.log('- CHK_URL:', process.env.CHK_URL ? 'SET' : 'MISSING');
console.log('- CHK_EMAIL:', process.env.CHK_EMAIL ? 'SET' : 'MISSING');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

try {
    console.log('🔴 DEBUG: Cargando express...');
    const express = require('express');
    
    console.log('🔴 DEBUG: Cargando cors...');
    const cors = require('cors');
    
    console.log('🔴 DEBUG: Cargando puppeteer...');
    const puppeteer = require('puppeteer');
    
    console.log('🔴 DEBUG: Todos los módulos cargados OK');
} catch (error) {
    console.error('❌ ERROR cargando módulos:', error);
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔴 DEBUG: Configurando middleware...');

// Middleware básico
app.use(cors());
app.use(express.json());

console.log('🔴 DEBUG: Configurando rutas...');

// Health check MUY simple
app.get('/api/health', (req, res) => {
    console.log('🔴 DEBUG: Health check llamado');
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando',
        timestamp: new Date().toISOString()
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    console.log('🔴 DEBUG: Ruta / llamada');
    res.json({ 
        message: 'Backend funcionando',
        status: 'ONLINE'
    });
});

// Ruta de prueba SIN Puppeteer
app.get('/api/test', (req, res) => {
    console.log('🔴 DEBUG: Test route llamado');
    res.json({ 
        success: true,
        message: 'Ruta de prueba funciona sin Puppeteer',
        timestamp: new Date().toISOString()
    });
});

// Ruta con Puppeteer SIMPLIFICADA
app.get('/api/test-puppeteer', async (req, res) => {
    console.log('🔴 DEBUG: Test Puppeteer iniciado');
    
    let browser;
    try {
        console.log('🔴 DEBUG: Intentando lanzar Puppeteer...');
        
        browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ]
        });
        
        console.log('🔴 DEBUG: Puppeteer lanzado exitosamente');
        
        const page = await browser.newPage();
        await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
        const title = await page.title();
        
        console.log('🔴 DEBUG: Título obtenido:', title);
        
        res.json({
            success: true,
            message: 'Puppeteer funciona correctamente',
            title: title
        });
        
    } catch (error) {
        console.error('🔴 DEBUG: Error en Puppeteer:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Puppeteer falló'
        });
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔴 DEBUG: Browser cerrado');
        }
    }
});

console.log('🔴 DEBUG: Todas las rutas configuradas');

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('✅ SERVIDOR INICIADO EXITOSAMENTE');
    console.log('✅ Puerto:', PORT);
    console.log('✅ Host: 0.0.0.0');
    console.log('✅ Tiempo:', new Date().toISOString());
    console.log('='.repeat(50));
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('💥 ERROR NO CAPTURADO:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 PROMISE RECHAZADA NO MANEJADA:', reason);
});

console.log('🔴 DEBUG: Manejadores de errores configurados');