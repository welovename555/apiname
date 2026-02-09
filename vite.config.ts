import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import https from "https";

// Middleware plugin to proxy Hero-SMS API requests during development
function heroSmsMiddleware() {
    return {
        name: 'hero-sms-middleware',
        configureServer(server: any) {
            server.middlewares.use((req: any, res: any, next: any) => {
                if (!req.url || !req.url.startsWith('/api/hero-sms')) {
                    return next();
                }
                console.log(`[hero-sms-middleware] ${req.method} ${req.url}`);
                const reqUrl = new URL(req.url, `http://${req.headers.host}`);
                const apiKey = req.headers['x-api-key'] || '';
                const targetUrl = new URL('https://hero-sms.com/stubs/handler_api.php');
                reqUrl.searchParams.forEach((value: string, key: string) => {
                    targetUrl.searchParams.set(key, value);
                });
                targetUrl.searchParams.set('api_key', apiKey as string);
                https.get(targetUrl.toString(), (proxyRes) => {
                    let body = '';
                    proxyRes.on('data', (chunk: string) => { body += chunk; });
                    proxyRes.on('end', () => {
                        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                        res.end(body);
                    });
                }).on('error', (err) => {
                    console.error('[hero-sms-middleware] Error:', err.message);
                    res.statusCode = 502;
                    res.end(JSON.stringify({ error: err.message }));
                });
            });
        }
    };
}

export default defineConfig(({ mode }) => ({
    // GitHub Pages serves from /apiname/ subdirectory
    base: mode === 'production' ? '/apiname/' : '/',
    server: {
        host: "::",
        port: 8080,
    },
    plugins: [
        react(),
        heroSmsMiddleware(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
}));
