// server.js - VERSIÓN CON PUPPETEER PARA PRUEBA
console.log('🔴 [1] Script iniciando...');

// 1. Cargar módulos básicos
try {
    console.log('🔴 [2] Cargando express...');
    const express = require('express');
    console.log('✅ [2] Express cargado OK');
    
    console.log('🔴 [2b] Cargando puppeteer...');
    const puppeteer = require('puppeteer');
    console.log('✅ [2b] Puppeteer cargado OK');
} catch (error) {
    console.log('❌ ERROR cargando módulos:', error.message);
    process.exit(1);
}

const express = require('express');
const puppeteer = require('puppeteer');

console.log('🔴 [3] Creando app Express...');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔴 [4] Configurando middleware CORS...');
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

app.use(express.json());

// Ruta para probar Puppeteer
app.get('/api/test-puppeteer', async (req, res) => {
    console.log('🧪 Probando Puppeteer...');
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('✅ Puppeteer iniciado correctamente');
        
        const page = await browser.newPage();
        await page.goto('https://example.com');
        const title = await page.title();
        
        res.json({ 
            success: true, 
            message: 'Puppeteer FUNCIONA con Dockerfile!',
            title: title,
            chromium: '✅ INSTALADO'
        });
    } catch (error) {
        console.log('❌ Error con Puppeteer:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    } finally {
        if (browser) await browser.close();
    }
});

console.log('🔴 [5] Configurando ruta health...');
app.get('/api/health', (req, res) => {
    console.log('✅ Health check ejecutado');
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando',
        timestamp: new Date().toISOString(),
        puppeteer: '✅ DISPONIBLE'
    });
});

console.log('🔴 [6] Configurando ruta raíz...');
app.get('/', (req, res) => {
    console.log('✅ Ruta / ejecutada');
    res.json({ 
        message: '🚀 Backend ONLINE con Dockerfile',
        status: 'SUCCESS',
        time: new Date().toISOString(),
        features: ['Express', 'Puppeteer', 'Chromium']
    });
});

console.log('🔴 [7] Configurando manejo de errores...');
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

console.log('🔴 [8] Iniciando servidor...');
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('✅ ✅ ✅ SERVIDOR INICIADO EXITOSAMENTE');
    console.log('✅ Puerto:', PORT);
    console.log('✅ Host: 0.0.0.0');
    console.log('✅ Hora:', new Date().toISOString());
    console.log('✅ Endpoints:');
    console.log('✅   GET /');
    console.log('✅   GET /api/health');
    console.log('✅   GET /api/test-puppeteer  ← Prueba Puppeteer');
    console.log('='.repeat(60));
});

console.log('🔴 [9] Server.js terminado de cargar');