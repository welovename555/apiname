const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware — allow requests from GitHub Pages
app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    // Allow GitHub Pages and localhost
    if (origin.includes('github.io') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// API proxy for Hero-SMS
app.use('/api/hero-sms', (req, res) => {
    const reqUrl = new URL(req.url || '', `http://${req.headers.host}`);
    const apiKey = req.headers['x-api-key'] || '';

    const targetUrl = new URL('https://hero-sms.com/stubs/handler_api.php');
    reqUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.set(key, value);
    });
    targetUrl.searchParams.set('api_key', apiKey);

    https.get(targetUrl.toString(), (proxyRes) => {
        let body = '';
        proxyRes.on('data', (chunk) => { body += chunk; });
        proxyRes.on('end', () => {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(body);
        });
    }).on('error', (err) => {
        console.error('[proxy] Error:', err.message);
        res.status(502).json({ error: err.message });
    });
});

// SPA fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
