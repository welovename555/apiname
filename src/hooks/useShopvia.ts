import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

// ===== Types =====
export interface ShopviaProduct {
    id: string;
    name: string;
    price: string;
    amount: number;
    description: string;
    flag: string | null;
    min: string;
    max: string;
}

export interface ShopviaCategory {
    id: string;
    name: string;
    icon: string;
    products: ShopviaProduct[];
}

export interface ShopviaProfile {
    username: string;
    balance: string;
    email: string;
}

export interface ShopviaOrderRecord {
    orderId: string;
    productName: string;
    qty: number;
    emails: { email: string; password: string }[];
    timestamp: number;
    totalCost: number;
}

// ===== Constants =====
const STORAGE_KEY_FAVORITES = 'shopvia_favorites';
const STORAGE_KEY_ORDERS = 'shopvia_orders';
const STORAGE_KEY_APIKEY = 'shopvia_api_key';

const DEFAULT_FAVORITE_IDS = [
    '43200', '43530', '43577', '25627', '42890', '22563', '41295'
];

const VND_TO_THB_RATE = 0.00145;

// ===== Helpers =====
export function formatVndPrice(p: string | number): string {
    const vnd = Number(p);
    const thb = vnd * VND_TO_THB_RATE;
    return vnd.toLocaleString('th-TH') + ' ₫'
        + (thb >= 0.01
            ? ` (${thb.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿)`
            : '');
}

export function parseEmails(rawData: string): { email: string; password: string }[] {
    const results: { email: string; password: string }[] = [];
    const lines = rawData.split('\n').filter(l => l.trim());
    for (const line of lines) {
        const separators = ['|', ':', '\t'];
        for (const sep of separators) {
            if (line.includes(sep)) {
                const parts = line.split(sep).map(s => s.trim());
                if (parts[0]?.includes('@') && parts[1]) {
                    results.push({ email: parts[0], password: parts[1] });
                    break;
                }
            }
        }
    }
    return results;
}

// ===== Hook =====
export function useShopvia() {
    // API Key state (user-provided, saved in localStorage)
    const [apiKey, setApiKeyState] = useState<string>(() => {
        try { return localStorage.getItem(STORAGE_KEY_APIKEY) || ''; } catch { return ''; }
    });
    const [connected, setConnected] = useState(false);
    const [hasEnvKey, setHasEnvKey] = useState(false);

    const [categories, setCategories] = useState<ShopviaCategory[]>([]);
    const [profile, setProfile] = useState<ShopviaProfile | null>(null);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [orders, setOrders] = useState<ShopviaOrderRecord[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    // Favorites
    const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
            return saved ? JSON.parse(saved) : DEFAULT_FAVORITE_IDS;
        } catch { return DEFAULT_FAVORITE_IDS; }
    });

    // API Key helpers
    const setApiKey = useCallback((key: string) => {
        setApiKeyState(key);
        try { localStorage.setItem(STORAGE_KEY_APIKEY, key); } catch { }
    }, []);

    const getHeaders = useCallback((extra?: Record<string, string>) => {
        const h: Record<string, string> = { ...extra };
        if (apiKey) h['x-api-key'] = apiKey;
        return h;
    }, [apiKey]);

    const toggleFavorite = useCallback((productId: string) => {
        setFavoriteIds(prev => {
            const next = prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId];
            localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next));
            return next;
        });
    }, []);

    const isFavorite = useCallback((productId: string) => {
        return favoriteIds.includes(productId);
    }, [favoriteIds]);

    const allProducts = useMemo(() => {
        const all: ShopviaProduct[] = [];
        categories.forEach(cat => cat.products.forEach(p => all.push(p)));
        return all;
    }, [categories]);

    const pinnedProducts = useMemo(() => {
        return favoriteIds
            .map(id => allProducts.find(p => p.id === id))
            .filter((p): p is ShopviaProduct => !!p);
    }, [allProducts, favoriteIds]);

    const saveOrders = useCallback((items: ShopviaOrderRecord[]) => {
        setOrders(items);
        try { localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(items)); } catch { }
    }, []);

    // Auto-delete orders older than 24h (check every minute for smooth countdown)
    useEffect(() => {
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const cleanup = () => {
            const now = Date.now();
            const filtered = orders.filter(item => now - item.timestamp < ONE_DAY);
            if (filtered.length !== orders.length) {
                saveOrders(filtered);
            }
        };
        cleanup();
        const interval = setInterval(cleanup, 60 * 1000); // every minute
        return () => clearInterval(interval);
    }, [orders.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(l => ({ ...l, products: true }));
        try {
            const res = await fetch('/api/shopvia/products', { headers: getHeaders() });
            const data = await res.json();
            if (data.categories && Array.isArray(data.categories)) {
                setCategories(data.categories);
            } else if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (err: any) {
            toast({ title: 'Error', description: 'โหลดสินค้าไม่สำเร็จ: ' + err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, products: false }));
        }
    }, [getHeaders]);

    // Fetch profile
    const fetchProfile = useCallback(async () => {
        setLoading(l => ({ ...l, profile: true }));
        try {
            const res = await fetch('/api/shopvia/profile', { headers: getHeaders() });
            const raw = await res.json();
            if (raw.error || raw.status === 'error') return;
            // API returns nested: { status, data: { username, money } }
            const d = raw.data || raw;
            setProfile({
                username: d.username || d.name || raw.username || '',
                balance: String(d.money ?? d.balance ?? raw.balance ?? '0'),
                email: d.email || raw.email || '',
            });
        } catch (err: any) {
            toast({ title: 'Error', description: 'โหลดโปรไฟล์ไม่สำเร็จ: ' + err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, profile: false }));
        }
    }, [getHeaders]);

    // Buy product
    const buyProduct = useCallback(async (productId: string, productName: string, amount: number, price: string) => {
        setLoading(l => ({ ...l, buy: true }));
        try {
            const res = await fetch('/api/shopvia/buy', {
                method: 'POST',
                headers: getHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ productId, amount }),
            });
            const raw = await res.json();

            if (raw.error || raw.status === 'error') {
                throw new Error(raw.error || raw.msg || 'ซื้อไม่สำเร็จ');
            }

            // Parse emails from response - API returns { status, msg, trans_id, data: [...] }
            let emails: { email: string; password: string }[] = [];
            const responseData = raw.data || raw.accounts;

            if (Array.isArray(responseData)) {
                // data is an array of strings like ["email|password", ...] or raw strings
                for (const item of responseData) {
                    const str = String(item).trim();
                    if (!str) continue;
                    // Try parsing as email|password
                    const parsed = parseEmails(str);
                    if (parsed.length > 0) {
                        emails.push(...parsed);
                    } else {
                        // Store raw string as email with empty password
                        emails.push({ email: str, password: '' });
                    }
                }
            } else if (typeof responseData === 'string' && responseData.trim()) {
                emails = parseEmails(responseData);
                if (emails.length === 0) {
                    // Store raw string
                    emails.push({ email: responseData.trim(), password: '' });
                }
            }

            const order: ShopviaOrderRecord = {
                orderId: raw.trans_id || raw.orderId || String(Date.now()),
                productName,
                qty: amount,
                emails,
                timestamp: Date.now(),
                totalCost: Number(price) * amount,
            };
            saveOrders([order, ...orders]);

            fetchProfile();
            fetchProducts();

            toast({ title: '🎉 ซื้อสำเร็จ!', description: `ได้รับ ${emails.length} รายการ` });
            return { success: true, emails, order };
        } catch (err: any) {
            toast({ title: 'ซื้อไม่สำเร็จ', description: err.message, variant: 'destructive' });
            return { success: false, emails: [], order: null };
        } finally {
            setLoading(l => ({ ...l, buy: false }));
        }
    }, [orders, saveOrders, fetchProfile, fetchProducts, getHeaders]);

    // Connect with API key
    const connect = useCallback(async (key: string) => {
        setLoading(l => ({ ...l, connect: true }));
        try {
            const trimmedKey = key.trim();
            const res = await fetch('/api/shopvia/profile', {
                headers: { 'x-api-key': trimmedKey },
            });
            const raw = await res.json();
            if (raw.error || raw.status === 'error' || raw.message?.includes('error')) {
                throw new Error(raw.error || raw.msg || raw.message || 'API Key ไม่ถูกต้อง');
            }
            // API returns nested: { status, data: { username, money } }
            const d = raw.data || raw;
            const balance = String(d.money ?? d.balance ?? raw.balance ?? '0');
            const username = d.username || d.name || raw.username || '';
            setApiKey(trimmedKey);
            setProfile({
                username,
                balance,
                email: d.email || raw.email || '',
            });
            setConnected(true);
            toast({ title: '✅ เชื่อมต่อสำเร็จ', description: `ยอดเงิน: ${formatVndPrice(balance)}` });
            // Fetch products after connecting
            const prodRes = await fetch('/api/shopvia/products', {
                headers: { 'x-api-key': trimmedKey },
            });
            const prodData = await prodRes.json();
            if (prodData.categories && Array.isArray(prodData.categories)) {
                setCategories(prodData.categories);
            } else if (Array.isArray(prodData)) {
                setCategories(prodData);
            }
        } catch (err: any) {
            toast({ title: 'เชื่อมต่อไม่สำเร็จ', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, connect: false }));
        }
    }, [setApiKey]);

    // Disconnect
    const disconnect = useCallback(() => {
        setApiKey('');
        setConnected(false);
        setProfile(null);
        setCategories([]);
        try { localStorage.removeItem(STORAGE_KEY_APIKEY); } catch { }
        toast({ title: 'ตัดการเชื่อมต่อแล้ว' });
    }, [setApiKey]);

    // Check env key status + auto-connect
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/shopvia/status');
                const data = await res.json();
                setHasEnvKey(data.hasApiKey);
                if (data.hasApiKey) {
                    setConnected(true);
                    await Promise.all([fetchProducts(), fetchProfile()]);
                } else if (apiKey) {
                    // Has saved key, try to auto-connect
                    await connect(apiKey);
                }
            } catch { }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        // Auth
        apiKey,
        connected,
        hasEnvKey,
        connect,
        disconnect,
        // Data
        categories,
        profile,
        loading,
        orders,
        favoriteIds,
        pinnedProducts,
        allProducts,
        // Actions
        toggleFavorite,
        isFavorite,
        fetchProducts,
        fetchProfile,
        buyProduct,
        saveOrders,
    };
}
