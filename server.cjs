const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SHOPVIA_API_KEY = process.env.SHOPVIA_API_KEY || '';
const SHOPVIA_BASE = 'https://shopvia1s.com/api';

// JSON body parser
app.use(express.json());

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

// ===== Shopvia1s API Proxy =====

// Products list
app.get('/api/shopvia/products', async (req, res) => {
    try {
        const key = req.headers['x-api-key'] || SHOPVIA_API_KEY;
        const r = await fetch(`${SHOPVIA_BASE}/products.php?api_key=${encodeURIComponent(key)}`);
        const data = await r.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Profile / balance
app.get('/api/shopvia/profile', async (req, res) => {
    try {
        const key = req.headers['x-api-key'] || SHOPVIA_API_KEY;
        const r = await fetch(`${SHOPVIA_BASE}/profile.php?api_key=${encodeURIComponent(key)}`);
        const data = await r.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Buy product
app.post('/api/shopvia/buy', async (req, res) => {
    try {
        const key = req.headers['x-api-key'] || SHOPVIA_API_KEY;
        const { productId, amount } = req.body;

        // API requires lowercase param names: id, amount (NOT ID, Amount)
        const formData = new URLSearchParams();
        formData.append('action', 'buyProduct');
        formData.append('id', String(productId));
        formData.append('amount', String(amount || 1));
        formData.append('coupon', '');
        formData.append('api_key', key);

        const r = await fetch(`${SHOPVIA_BASE}/buy_product`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        });
        const data = await r.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Order history
app.get('/api/shopvia/orders', async (req, res) => {
    try {
        const key = req.headers['x-api-key'] || SHOPVIA_API_KEY;
        const r = await fetch(`${SHOPVIA_BASE}/order.php?api_key=${encodeURIComponent(key)}`);
        const data = await r.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API key status check
app.get('/api/shopvia/status', (req, res) => {
    res.json({ hasApiKey: !!SHOPVIA_API_KEY });
});

// SPA fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
