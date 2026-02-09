import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useHeroSMS, HeroHistoryItem } from '@/hooks/useHeroSMS';
import {
    Smartphone, Wifi, WifiOff, DollarSign, Copy, Check, X, Clock, Loader2, Phone,
    ShieldCheck, Trash2, RefreshCw, Key, AlertCircle, CheckCircle2, XCircle, Timer
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// ===== API Key Bar =====
function ApiKeyBar({
    apiKey, onConnect, onDisconnect, connected, balance, loading
}: {
    apiKey: string;
    onConnect: (key: string) => void;
    onDisconnect: () => void;
    connected: boolean;
    balance: number | null;
    loading: boolean;
}) {
    const [inputKey, setInputKey] = useState(apiKey);

    return (
        <Card className="border-primary/20 bg-gradient-to-r from-background to-primary/5">
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1 w-full">
                        <Key className="h-5 w-5 text-muted-foreground shrink-0" />
                        <Input
                            type="password"
                            placeholder="ใส่ Hero-SMS API Key..."
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            className="flex-1 font-mono text-sm"
                            disabled={connected}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {!connected ? (
                            <Button
                                onClick={() => onConnect(inputKey)}
                                disabled={!inputKey.trim() || loading}
                                className="w-full sm:w-auto"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wifi className="h-4 w-4 mr-2" />}
                                เชื่อมต่อ
                            </Button>
                        ) : (
                            <>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1 px-3 py-1.5">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    {balance !== null ? balance.toFixed(2) : '...'}
                                </Badge>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1 px-3 py-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    เชื่อมต่อแล้ว
                                </Badge>
                                <Button variant="outline" size="sm" onClick={onDisconnect}>
                                    <WifiOff className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ===== Service & Country Selector =====
function ServiceSelector({
    countries, services, selectedCountry, selectedService,
    onCountryChange, onServiceChange, loading
}: {
    countries: { id: number; eng: string }[];
    services: { code: string; name: string }[];
    selectedCountry: string;
    selectedService: string;
    onCountryChange: (v: string) => void;
    onServiceChange: (v: string) => void;
    loading: Record<string, boolean>;
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">🌍 ประเทศ</label>
                <Select value={selectedCountry} onValueChange={onCountryChange} disabled={loading.countries}>
                    <SelectTrigger>
                        <SelectValue placeholder={loading.countries ? 'กำลังโหลด...' : 'เลือกประเทศ'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {countries.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.eng}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">📱 บริการ</label>
                <Select value={selectedService} onValueChange={onServiceChange} disabled={!selectedCountry || loading.services}>
                    <SelectTrigger>
                        <SelectValue placeholder={loading.services ? 'กำลังโหลด...' : 'เลือกบริการ'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {services.map(s => (
                            <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// ===== Countdown Timer =====
function CountdownTimer({ startTime }: { startTime: number }) {
    const [remaining, setRemaining] = useState(0);
    const TOTAL_MS = 15 * 60 * 1000;

    useEffect(() => {
        const update = () => {
            const elapsed = Date.now() - startTime;
            const left = Math.max(0, TOTAL_MS - elapsed);
            setRemaining(left);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const progress = (remaining / TOTAL_MS) * 100;
    const isLow = remaining < 3 * 60 * 1000;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Timer className={`h-4 w-4 ${isLow ? 'text-destructive animate-pulse' : 'text-amber-500'}`} />
                    <span className={`text-lg font-mono font-bold ${isLow ? 'text-destructive' : 'text-amber-500'}`}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                </div>
                <span className="text-xs text-muted-foreground">เหลือเวลา</span>
            </div>
            <Progress value={progress} className={`h-2 ${isLow ? '[&>div]:bg-destructive' : '[&>div]:bg-amber-500'}`} />
        </div>
    );
}

// ===== OTP Display =====
function OtpDisplay({ otp }: { otp: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(otp);
            setCopied(true);
            toast({ title: 'คัดลอกแล้ว!', description: otp });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: 'Error', description: 'Copy failed', variant: 'destructive' });
        }
    };

    return (
        <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <ShieldCheck className="h-8 w-8 text-emerald-500" />
            <span className="text-4xl font-mono font-bold tracking-widest text-emerald-500">
                {otp}
            </span>
            <Button variant="outline" size="icon" onClick={handleCopy} className="ml-2">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
    );
}

// ===== Status Badge =====
function StatusBadge({ status }: { status: HeroHistoryItem['status'] }) {
    const styles: Record<string, { className: string; icon: typeof Check; label: string }> = {
        waiting: { className: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: Clock, label: 'รอ SMS' },
        received: { className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', icon: CheckCircle2, label: 'ได้รับแล้ว' },
        cancelled: { className: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle, label: 'ยกเลิก' },
        completed: { className: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Check, label: 'เสร็จสิ้น' },
    };
    const s = styles[status] || styles.waiting;
    const Icon = s.icon;
    return (
        <Badge variant="outline" className={`${s.className} gap-1`}>
            <Icon className="h-3 w-3" />
            {s.label}
        </Badge>
    );
}

// ===== Pricing Tab =====
function PricingTab({
    connected, countries, services, loading, prices,
    selectedCountry, selectedService,
    onCountryChange, onServiceChange, onCheckPrice
}: {
    connected: boolean;
    countries: { id: number; eng: string }[];
    services: { code: string; name: string }[];
    loading: Record<string, boolean>;
    prices: { cost: number; count: number } | null;
    selectedCountry: string;
    selectedService: string;
    onCountryChange: (v: string) => void;
    onServiceChange: (v: string) => void;
    onCheckPrice: () => void;
}) {
    if (!connected) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">กรุณาเชื่อมต่อ API Key ก่อน</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        เปรียบเทียบราคา
                    </CardTitle>
                    <CardDescription>เลือกประเทศและบริการเพื่อดูราคาและจำนวนเบอร์ว่าง</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ServiceSelector
                        countries={countries} services={services}
                        selectedCountry={selectedCountry} selectedService={selectedService}
                        onCountryChange={onCountryChange} onServiceChange={onServiceChange}
                        loading={loading}
                    />

                    <Button
                        onClick={onCheckPrice}
                        disabled={!selectedService || !selectedCountry || loading.prices}
                        className="w-full"
                    >
                        {loading.prices ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <DollarSign className="h-4 w-4 mr-2" />
                        )}
                        เช็คราคา
                    </Button>

                    {prices && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="pt-4 text-center">
                                    <p className="text-sm text-muted-foreground">ราคา</p>
                                    <p className="text-3xl font-bold text-primary">${prices.cost.toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-emerald-500/5 border-emerald-500/20">
                                <CardContent className="pt-4 text-center">
                                    <p className="text-sm text-muted-foreground">เบอร์ว่าง</p>
                                    <p className="text-3xl font-bold text-emerald-500">{prices.count.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ===== Buy Tab =====
function BuyTab({
    connected, countries, services, loading, prices, activeOrder,
    selectedCountry, selectedService,
    onCountryChange, onServiceChange, onCheckPrice, onBuy,
    onCancel, onComplete
}: {
    connected: boolean;
    countries: { id: number; eng: string }[];
    services: { code: string; name: string }[];
    loading: Record<string, boolean>;
    prices: { cost: number; count: number } | null;
    activeOrder: any;
    selectedCountry: string;
    selectedService: string;
    onCountryChange: (v: string) => void;
    onServiceChange: (v: string) => void;
    onCheckPrice: () => void;
    onBuy: () => void;
    onCancel: () => void;
    onComplete: () => void;
}) {
    const [phoneCopied, setPhoneCopied] = useState(false);

    const copyPhone = async (phone: string) => {
        try {
            await navigator.clipboard.writeText(phone);
            setPhoneCopied(true);
            toast({ title: 'คัดลอกเบอร์แล้ว!', description: phone });
            setTimeout(() => setPhoneCopied(false), 2000);
        } catch { }
    };

    if (!connected) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">กรุณาเชื่อมต่อ API Key ก่อน</p>
                </CardContent>
            </Card>
        );
    }

    // Active order view
    if (activeOrder) {
        return (
            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        เบอร์ที่กำลังใช้งาน
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Phone number */}
                    <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <Phone className="h-6 w-6 text-primary" />
                        <span className="text-2xl font-mono font-bold tracking-wider">
                            {activeOrder.phoneNumber}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => copyPhone(activeOrder.phoneNumber)}>
                            {phoneCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between p-2 rounded bg-muted/50">
                            <span className="text-muted-foreground">ราคา</span>
                            <span className="font-medium">${activeOrder.activationCost}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-muted/50">
                            <span className="text-muted-foreground">Operator</span>
                            <span className="font-medium">{activeOrder.activationOperator || '-'}</span>
                        </div>
                    </div>

                    {/* Countdown */}
                    {activeOrder.status === 'waiting' && (
                        <CountdownTimer startTime={activeOrder.startTime} />
                    )}

                    {/* OTP Display */}
                    {activeOrder.otp ? (
                        <OtpDisplay otp={activeOrder.otp} />
                    ) : activeOrder.status === 'waiting' ? (
                        <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                            <span className="text-muted-foreground">กำลังรอ SMS... (poll ทุก 5 วินาที)</span>
                        </div>
                    ) : null}

                    {/* Status */}
                    <div className="flex justify-center">
                        <StatusBadge status={activeOrder.status} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        {activeOrder.status === 'waiting' && (
                            <Button variant="destructive" onClick={onCancel} className="flex-1" disabled={loading.setStatus}>
                                {loading.setStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                                ยกเลิก
                            </Button>
                        )}
                        {(activeOrder.status === 'received' || activeOrder.otp) && (
                            <Button onClick={onComplete} className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading.setStatus}>
                                {loading.setStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                เสร็จสิ้น
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Buy form
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        ซื้อเบอร์ SMS
                    </CardTitle>
                    <CardDescription>เลือกประเทศและบริการ แล้วกดซื้อเบอร์</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ServiceSelector
                        countries={countries} services={services}
                        selectedCountry={selectedCountry} selectedService={selectedService}
                        onCountryChange={onCountryChange} onServiceChange={onServiceChange}
                        loading={loading}
                    />

                    {/* Auto check price button */}
                    {selectedService && selectedCountry && !prices && (
                        <Button variant="outline" onClick={onCheckPrice} disabled={loading.prices} className="w-full">
                            {loading.prices ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                            เช็คราคาก่อนซื้อ
                        </Button>
                    )}

                    {prices && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                                    <p className="text-xs text-muted-foreground">ราคา</p>
                                    <p className="text-xl font-bold text-primary">${prices.cost.toFixed(2)}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                                    <p className="text-xs text-muted-foreground">เบอร์ว่าง</p>
                                    <p className="text-xl font-bold text-emerald-500">{prices.count.toLocaleString()}</p>
                                </div>
                            </div>

                            <Button
                                onClick={onBuy}
                                disabled={loading.buy || prices.count === 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                size="lg"
                            >
                                {loading.buy ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Smartphone className="h-4 w-4 mr-2" />
                                )}
                                ซื้อเบอร์ (${prices.cost.toFixed(2)})
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ===== History Tab =====
function HistoryTab({
    history, onClear
}: {
    history: HeroHistoryItem[];
    onClear: () => void;
}) {
    const [copied, setCopied] = useState<string | null>(null);

    const copyText = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(id);
            toast({ title: 'คัดลอกแล้ว!', description: text });
            setTimeout(() => setCopied(null), 2000);
        } catch { }
    };

    if (history.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">ยังไม่มีประวัติ</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        ประวัติ ({history.length})
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={onClear} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        ล้าง
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[100px]">เวลา</TableHead>
                                <TableHead className="min-w-[120px]">เบอร์</TableHead>
                                <TableHead>บริการ</TableHead>
                                <TableHead>ประเทศ</TableHead>
                                <TableHead>ราคา</TableHead>
                                <TableHead>OTP</TableHead>
                                <TableHead>สถานะ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((item) => (
                                <TableRow key={`${item.activationId}-${item.timestamp}`}>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(item.timestamp).toLocaleString('th-TH', {
                                            month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span className="font-mono text-sm">{item.phoneNumber}</span>
                                            <Button
                                                variant="ghost" size="icon" className="h-6 w-6"
                                                onClick={() => copyText(item.phoneNumber, `phone-${item.activationId}`)}
                                            >
                                                {copied === `phone-${item.activationId}` ? (
                                                    <Check className="h-3 w-3 text-emerald-500" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{item.serviceName || item.service}</TableCell>
                                    <TableCell className="text-sm">{item.countryName || item.country}</TableCell>
                                    <TableCell className="font-mono text-sm">${item.cost}</TableCell>
                                    <TableCell>
                                        {item.otp ? (
                                            <div className="flex items-center gap-1">
                                                <span className="font-mono font-bold text-emerald-500">{item.otp}</span>
                                                <Button
                                                    variant="ghost" size="icon" className="h-6 w-6"
                                                    onClick={() => copyText(item.otp!, `otp-${item.activationId}`)}
                                                >
                                                    {copied === `otp-${item.activationId}` ? (
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell><StatusBadge status={item.status} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// ===== MAIN PAGE =====
export default function App() {
    const sms = useHeroSMS();
    const [selectedCountry, setSelectedCountry] = useState('52'); // Default: Thailand
    const [selectedService, setSelectedService] = useState('ka'); // Default: Shopee
    const [activeTab, setActiveTab] = useState('buy');
    const [defaultsApplied, setDefaultsApplied] = useState(false);

    // Fetch countries when connected
    useEffect(() => {
        if (sms.connected) {
            sms.fetchCountries();
        }
    }, [sms.connected]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-load services for default country when countries load
    useEffect(() => {
        if (sms.connected && sms.countries.length > 0 && !defaultsApplied) {
            sms.fetchServices('52'); // Thailand
        }
    }, [sms.connected, sms.countries.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-fetch prices for default service when services load
    useEffect(() => {
        if (sms.connected && sms.services.length > 0 && !defaultsApplied) {
            const hasShopee = sms.services.some(s => s.code === 'ka');
            if (hasShopee) {
                sms.fetchPrices('ka', '52');
            }
            setDefaultsApplied(true);
        }
    }, [sms.connected, sms.services.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch services when country changes
    const handleCountryChange = (country: string) => {
        setSelectedCountry(country);
        setSelectedService('');
        sms.fetchServices(country);
    };

    // Fetch prices when service changes
    const handleServiceChange = (service: string) => {
        setSelectedService(service);
        if (selectedCountry && service) {
            sms.fetchPrices(service, selectedCountry);
        }
    };

    const handleCheckPrice = () => {
        if (selectedService && selectedCountry) {
            sms.fetchPrices(selectedService, selectedCountry);
        }
    };

    const handleBuy = () => {
        if (!selectedService || !selectedCountry) return;
        const serviceName = sms.services.find(s => s.code === selectedService)?.name || selectedService;
        const countryName = sms.countries.find(c => String(c.id) === selectedCountry)?.eng || selectedCountry;
        sms.buyNumber(selectedService, selectedCountry, serviceName, countryName);
    };

    const handleCancel = () => {
        if (sms.activeOrder) {
            sms.setOrderStatus(sms.activeOrder.activationId, 8);
        }
    };

    const handleComplete = () => {
        if (sms.activeOrder) {
            sms.setOrderStatus(sms.activeOrder.activationId, 6);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                    <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hero-SMS Client</h1>
                    <p className="text-sm text-muted-foreground">จัดการเบอร์ SMS ชั่วคราว</p>
                </div>
                {sms.connected && (
                    <Button variant="ghost" size="icon" className="ml-auto" onClick={sms.fetchBalance} disabled={sms.loading.balance}>
                        <RefreshCw className={`h-4 w-4 ${sms.loading.balance ? 'animate-spin' : ''}`} />
                    </Button>
                )}
            </div>

            {/* API Key Bar */}
            <ApiKeyBar
                apiKey={sms.apiKey}
                onConnect={sms.connect}
                onDisconnect={sms.disconnect}
                connected={sms.connected}
                balance={sms.balance}
                loading={sms.loading.connect}
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pricing" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">ราคา</span>
                    </TabsTrigger>
                    <TabsTrigger value="buy" className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span className="hidden sm:inline">ซื้อเบอร์</span>
                        {sms.activeOrder && (
                            <span className="ml-1 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">ประวัติ</span>
                        {sms.history.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                                {sms.history.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pricing">
                    <PricingTab
                        connected={sms.connected}
                        countries={sms.countries} services={sms.services}
                        loading={sms.loading} prices={sms.prices}
                        selectedCountry={selectedCountry} selectedService={selectedService}
                        onCountryChange={handleCountryChange} onServiceChange={handleServiceChange}
                        onCheckPrice={handleCheckPrice}
                    />
                </TabsContent>

                <TabsContent value="buy">
                    <BuyTab
                        connected={sms.connected}
                        countries={sms.countries} services={sms.services}
                        loading={sms.loading} prices={sms.prices}
                        activeOrder={sms.activeOrder}
                        selectedCountry={selectedCountry} selectedService={selectedService}
                        onCountryChange={handleCountryChange} onServiceChange={handleServiceChange}
                        onCheckPrice={handleCheckPrice} onBuy={handleBuy}
                        onCancel={handleCancel} onComplete={handleComplete}
                    />
                </TabsContent>

                <TabsContent value="history">
                    <HistoryTab history={sms.history} onClear={sms.clearHistory} />
                </TabsContent>
            </Tabs>
            <Toaster />
        </div>
    );
}
