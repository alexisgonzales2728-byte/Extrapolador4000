// Agrega esto ANTES de las otras rutas, después de app.use(express.json());

// Ruta de diagnóstico Chromium
app.get('/api/debug-chromium', (req, res) => {
    const fs = require('fs');
    
    try {
        console.log('🔍 Diagnosticando Chromium...');
        
        // Verificar rutas comunes
        const pathsToCheck = [
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium', 
            '/usr/bin/chrome',
            '/usr/bin/google-chrome',
            '/usr/lib/chromium/chromium',
            '/usr/lib/chromium-browser/chromium-browser'
        ];
        
        const results = {};
        pathsToCheck.forEach(path => {
            try {
                results[path] = {
                    exists: fs.existsSync(path),
                    isFile: fs.existsSync(path) ? fs.statSync(path).isFile() : false
                };
            } catch (e) {
                results[path] = { error: e.message };
            }
        });
        
        // Listar archivos chrom* en /usr/bin
        let chromFiles = [];
        try {
            chromFiles = fs.readdirSync('/usr/bin').filter(f => f.includes('chrom'));
        } catch (e) {
            chromFiles = ['ERROR: ' + e.message];
        }
        
        console.log('📊 Resultados diagnóstico:', results);
        
        res.json({
            status: 'Diagnóstico completado',
            paths: results,
            chromFilesInUsrBin: chromFiles,
            environment: {
                PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
                NODE_ENV: process.env.NODE_ENV
            },
            tips: [
                'Si todas las rutas son false, Chromium no está instalado',
                'Si alguna es true, usa esa ruta en puppeteer.launch()'
            ]
        });
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        res.status(500).json({ error: error.message });
    }
});