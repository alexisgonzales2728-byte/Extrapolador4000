// server.js - VERSIÓN SIN DEPENDENCIAS EXTERNAS
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
            message: '✅ Backend funcionando',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production'
        }));
    } else if (req.url === '/api/search-bin' && req.method === 'POST') {
        // Simular respuesta para BIN
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { bin } = JSON.parse(body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: `Búsqueda simulada para BIN: ${bin}`,
                    data: [],
                    count: 0,
                    debug: 'Modo sin dependencias - Puppeteer no disponible'
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'JSON inválido' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('✅ SERVER ACTIVO - Northflank');
    console.log('✅ Puerto:', PORT);
    console.log('✅ Host: 0.0.0.0');
    console.log('✅ URL:', `http://0.0.0.0:${PORT}`);
    console.log('='.repeat(50));
});