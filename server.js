// server.js - VERSIÓN MÍNIMA FUNCIONAL
console.log('🔴 [1] Script iniciando...');

// 1. Cargar módulos básicos
try {
    console.log('🔴 [2] Cargando express...');
    const express = require('express');
    console.log('✅ [2] Express cargado OK');
} catch (error) {
    console.log('❌ [2] ERROR cargando express:', error.message);
    process.exit(1);
}

const express = require('express');

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

console.log('🔴 [5] Configurando ruta health...');
app.get('/api/health', (req, res) => {
    console.log('✅ Health check ejecutado');
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando',
        timestamp: new Date().toISOString()
    });
});

console.log('🔴 [6] Configurando ruta raíz...');
app.get('/', (req, res) => {
    console.log('✅ Ruta / ejecutada');
    res.json({ 
        message: '🚀 Backend ONLINE',
        status: 'SUCCESS',
        time: new Date().toISOString()
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
    console.log('='.repeat(60));
});

console.log('🔴 [9] Server.js terminado de cargar');