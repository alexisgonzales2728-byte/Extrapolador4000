// server-simple.js - SIN EXPRESS, SIN DEPENDENCIAS
console.log('🚀 SERVER NATIVO INICIANDO...');

const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    console.log('✅ Request recibida:', req.url);
    
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'OK',
            message: '✅ Backend funcionando SIN dependencias',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production'
        }));
    } else if (req.url === '/api/test' && req.method === 'POST') {
        // Simular respuesta para BIN
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Modo de prueba - Servidor funcionando',
                data: [],
                count: 0
            }));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('✅ SERVER NATIVO ACTIVO');
    console.log('✅ Puerto:', PORT);
    console.log('✅ Host: 0.0.0.0');
    console.log('✅ Endpoints:');
    console.log('✅   GET  /health');
    console.log('✅   GET  /');
    console.log('✅   POST /api/test');
    console.log('='.repeat(50));
});