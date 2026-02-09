import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

// In production (GitHub Pages), API calls go to the VPS proxy
// In development, they use the local Vite middleware
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocalDev ? '' : 'http://203.154.83.192';
const API_PATH = `${API_BASE}/api/hero-sms`;

const STORAGE_KEY_APIKEY = 'hero-sms-api-key';
const STORAGE_KEY_HISTORY = 'hero-sms-history';

export interface HeroCountry {
    id: number;
    eng: string;
    visible: number;
}

export interface HeroService {
    code: string;
    name: string;
}

export interface HeroPriceInfo {
    cost: number;
    count: number;
}

export interface HeroActiveOrder {
    activationId: string;
    phoneNumber: string;
    activationCost: string;
    activationOperator: string;
    startTime: number;
    otp?: string;
    status: 'waiting' | 'received' | 'cancelled' | 'completed';
}

export interface HeroHistoryItem {
    activationId: string;
    phoneNumber: string;
    service: string;
    serviceName: string;
    country: string;
    countryName: string;
    cost: string;
    operator: string;
    otp?: string;
    status: 'waiting' | 'received' | 'cancelled' | 'completed';
    timestamp: number;
}

async function heroFetch(action: string, apiKey: string, params?: Record<string, string>) {
    const url = new URL(API_PATH, window.location.origin);
    url.searchParams.set('action', action);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            url.searchParams.set(k, v);
        }
    }
    const res = await fetch(url.toString(), {
        headers: { 'x-api-key': apiKey },
    });
    if (!res.ok) {
        const errText = await res.text();
        let errMsg = 'Network error';
        try { errMsg = JSON.parse(errText).error || errMsg; } catch { errMsg = errText || errMsg; }
        throw new Error(errMsg);
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { raw: text }; }
}

export function useHeroSMS() {
    const [apiKey, setApiKeyState] = useState<string>(() => {
        try { return localStorage.getItem(STORAGE_KEY_APIKEY) || ''; } catch { return ''; }
    });
    const [connected, setConnected] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [countries, setCountries] = useState<HeroCountry[]>([]);
    const [services, setServices] = useState<HeroService[]>([]);
    const [prices, setPrices] = useState<HeroPriceInfo | null>(null);
    const [activeOrder, setActiveOrder] = useState<HeroActiveOrder | null>(null);
    const [history, setHistory] = useState<HeroHistoryItem[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const setApiKey = useCallback((key: string) => {
        setApiKeyState(key);
        try { localStorage.setItem(STORAGE_KEY_APIKEY, key); } catch { }
    }, []);

    const saveHistory = useCallback((items: HeroHistoryItem[]) => {
        setHistory(items);
        try { localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items)); } catch { }
    }, []);

    // Fetch balance
    const fetchBalance = useCallback(async () => {
        if (!apiKey) return;
        setLoading(l => ({ ...l, balance: true }));
        try {
            const data = await heroFetch('getBalance', apiKey);
            const raw = data.raw || '';
            const match = raw.match(/ACCESS_BALANCE:([\d.]+)/);
            if (match) {
                setBalance(parseFloat(match[1]));
            } else if (typeof data === 'object' && data.balance) {
                setBalance(parseFloat(data.balance));
            } else {
                throw new Error('ไม่สามารถอ่านยอดเงินได้: ' + raw);
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, balance: false }));
        }
    }, [apiKey]);

    // Fetch countries
    const fetchCountries = useCallback(async () => {
        if (!apiKey) return;
        setLoading(l => ({ ...l, countries: true }));
        try {
            const data = await heroFetch('getCountries', apiKey);
            if (Array.isArray(data)) {
                setCountries(data.filter((c: HeroCountry) => c.visible === 1));
            } else if (data.raw) {
                // Try parse raw text
                try {
                    const parsed = JSON.parse(data.raw);
                    if (Array.isArray(parsed)) {
                        setCountries(parsed.filter((c: HeroCountry) => c.visible === 1));
                    }
                } catch { }
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, countries: false }));
        }
    }, [apiKey]);

    // Fetch services for a country
    const fetchServices = useCallback(async (country: string) => {
        if (!apiKey || !country) return;
        setLoading(l => ({ ...l, services: true }));
        try {
            const data = await heroFetch('getServicesList', apiKey, { country, lang: 'en' });
            if (data.services && Array.isArray(data.services)) {
                setServices(data.services);
            } else if (data.raw) {
                try {
                    const parsed = JSON.parse(data.raw);
                    if (parsed.services) setServices(parsed.services);
                } catch { }
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, services: false }));
        }
    }, [apiKey]);

    // Fetch prices
    const fetchPrices = useCallback(async (service: string, country: string) => {
        if (!apiKey || !service || !country) return;
        setLoading(l => ({ ...l, prices: true }));
        setPrices(null);
        try {
            const data = await heroFetch('getPrices', apiKey, { service, country });
            // Response: { countryId: { serviceCode: { cost, count } } }
            let priceData: HeroPriceInfo | null = null;
            if (data.raw) {
                try {
                    const parsed = JSON.parse(data.raw);
                    const countryData = Object.values(parsed)[0] as any;
                    if (countryData) {
                        const serviceData = Object.values(countryData)[0] as any;
                        if (serviceData) {
                            priceData = { cost: parseFloat(serviceData.cost), count: parseInt(serviceData.count) };
                        }
                    }
                } catch { }
            } else {
                const countryData = Object.values(data)[0] as any;
                if (countryData) {
                    const serviceData = Object.values(countryData)[0] as any;
                    if (serviceData) {
                        priceData = { cost: parseFloat(serviceData.cost), count: parseInt(serviceData.count) };
                    }
                }
            }
            setPrices(priceData);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, prices: false }));
        }
    }, [apiKey]);

    // Buy number
    const buyNumber = useCallback(async (service: string, country: string, serviceName: string, countryName: string) => {
        if (!apiKey) return;
        setLoading(l => ({ ...l, buy: true }));
        try {
            const data = await heroFetch('getNumberV2', apiKey, { service, country });
            let orderData: any = data;
            if (data.raw) {
                try { orderData = JSON.parse(data.raw); } catch { }
            }

            if (orderData.activationId) {
                const order: HeroActiveOrder = {
                    activationId: String(orderData.activationId),
                    phoneNumber: orderData.phoneNumber,
                    activationCost: orderData.activationCost || orderData.cost || '0',
                    activationOperator: orderData.activationOperator || orderData.operator || '',
                    startTime: Date.now(),
                    status: 'waiting',
                };
                setActiveOrder(order);
                // Add to history
                const historyItem: HeroHistoryItem = {
                    ...order,
                    service,
                    serviceName,
                    country,
                    countryName,
                    cost: order.activationCost,
                    operator: order.activationOperator,
                    status: 'waiting',
                    timestamp: Date.now(),
                };
                saveHistory([historyItem, ...history]);
                // Refresh balance
                fetchBalance();
                toast({ title: 'สำเร็จ!', description: `ซื้อเบอร์ ${order.phoneNumber} แล้ว` });
            } else {
                const errMsg = orderData.raw || orderData.error || JSON.stringify(orderData);
                throw new Error('ซื้อเบอร์ไม่สำเร็จ: ' + errMsg);
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, buy: false }));
        }
    }, [apiKey, history, saveHistory, fetchBalance]);

    // Check status (poll for OTP)
    const checkStatus = useCallback(async (id: string) => {
        if (!apiKey) return;
        try {
            const data = await heroFetch('getStatus', apiKey, { id });
            const raw = data.raw || '';

            if (raw.includes('STATUS_OK')) {
                const code = raw.split(':')[1] || '';
                return { status: 'received' as const, code };
            } else if (raw.includes('STATUS_WAIT_CODE')) {
                return { status: 'waiting' as const, code: '' };
            } else if (raw.includes('STATUS_CANCEL')) {
                return { status: 'cancelled' as const, code: '' };
            }
            return { status: 'waiting' as const, code: '' };
        } catch {
            return { status: 'waiting' as const, code: '' };
        }
    }, [apiKey]);

    // Set status (cancel=8, complete=6, ready=1)
    const setOrderStatus = useCallback(async (id: string, status: number) => {
        if (!apiKey) return;
        setLoading(l => ({ ...l, setStatus: true }));
        try {
            await heroFetch('setStatus', apiKey, { id, status: String(status) });
            const newStatus = status === 8 ? 'cancelled' : status === 6 ? 'completed' : 'waiting';

            // Update active order
            if (activeOrder?.activationId === id) {
                setActiveOrder(prev => prev ? { ...prev, status: newStatus } : null);
            }

            // Update history
            const updated = history.map(h =>
                h.activationId === id ? { ...h, status: newStatus as HeroHistoryItem['status'] } : h
            );
            saveHistory(updated);

            // Stop polling
            if (status === 8 || status === 6) {
                if (pollRef.current) {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }
                if (activeOrder?.activationId === id) {
                    setActiveOrder(null);
                }
            }

            if (status === 8) {
                toast({ title: 'ยกเลิกแล้ว', description: 'ยกเลิกเบอร์เรียบร้อย' });
                fetchBalance(); // Refund
            } else if (status === 6) {
                toast({ title: 'เสร็จสิ้น', description: 'ทำรายการเสร็จสิ้น' });
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, setStatus: false }));
        }
    }, [apiKey, activeOrder, history, saveHistory, fetchBalance]);

    // Connect: save key + fetch balance + countries
    const connect = useCallback(async (key: string) => {
        setApiKey(key);
        setLoading(l => ({ ...l, connect: true }));
        try {
            // Verify key by fetching balance
            const data = await heroFetch('getBalance', key);
            const raw = data.raw || '';
            const match = raw.match(/ACCESS_BALANCE:([\d.]+)/);
            if (match) {
                setBalance(parseFloat(match[1]));
                setConnected(true);
                toast({ title: 'เชื่อมต่อสำเร็จ!', description: `ยอดเงิน: $${match[1]}` });
            } else if (raw.includes('BAD_KEY') || raw.includes('ERROR')) {
                throw new Error('API Key ไม่ถูกต้อง');
            } else {
                throw new Error('ไม่สามารถเชื่อมต่อได้: ' + raw);
            }
        } catch (err: any) {
            setConnected(false);
            setBalance(null);
            toast({ title: 'เชื่อมต่อไม่สำเร็จ', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(l => ({ ...l, connect: false }));
        }
    }, [setApiKey]);

    // Auto-connect on mount if key exists
    useEffect(() => {
        if (apiKey && !connected) {
            connect(apiKey);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Poll for OTP when active order exists
    useEffect(() => {
        if (!activeOrder || activeOrder.status !== 'waiting') {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return;
        }

        const poll = async () => {
            const result = await checkStatus(activeOrder.activationId);
            if (result.status === 'received' && result.code) {
                setActiveOrder(prev => prev ? { ...prev, otp: result.code, status: 'received' } : null);
                // Update history
                const updated = history.map(h =>
                    h.activationId === activeOrder.activationId
                        ? { ...h, otp: result.code, status: 'received' as const }
                        : h
                );
                saveHistory(updated);
                toast({ title: '🎉 ได้รับ OTP!', description: `รหัส: ${result.code}` });
            } else if (result.status === 'cancelled') {
                setActiveOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
            }
        };

        // Poll immediately, then every 5 seconds
        poll();
        pollRef.current = setInterval(poll, 5000);

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [activeOrder?.activationId, activeOrder?.status]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-cancel when 15 minutes expire
    useEffect(() => {
        if (!activeOrder || activeOrder.status !== 'waiting') return;

        const elapsed = Date.now() - activeOrder.startTime;
        const remaining = 15 * 60 * 1000 - elapsed;

        if (remaining <= 0) {
            setOrderStatus(activeOrder.activationId, 8);
            return;
        }

        const timeout = setTimeout(() => {
            setOrderStatus(activeOrder.activationId, 8);
            toast({ title: 'หมดเวลา', description: 'เบอร์ถูกยกเลิกอัตโนมัติเนื่องจากหมดเวลา 15 นาที', variant: 'destructive' });
        }, remaining);

        return () => clearTimeout(timeout);
    }, [activeOrder?.activationId, activeOrder?.startTime, activeOrder?.status]); // eslint-disable-line react-hooks/exhaustive-deps

    const clearHistory = useCallback(() => {
        saveHistory([]);
    }, [saveHistory]);

    const disconnect = useCallback(() => {
        setConnected(false);
        setBalance(null);
        setCountries([]);
        setServices([]);
        setPrices(null);
        setActiveOrder(null);
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    return {
        apiKey, setApiKey,
        connected, connect, disconnect,
        balance, fetchBalance,
        countries, fetchCountries,
        services, fetchServices,
        prices, fetchPrices,
        activeOrder, setActiveOrder,
        buyNumber,
        checkStatus, setOrderStatus,
        history, clearHistory,
        loading,
    };
}
