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
import { useShopvia, ShopviaProduct, formatVndPrice } from '@/hooks/useShopvia';
import {
    Smartphone, Wifi, WifiOff, DollarSign, Copy, Check, X, Clock, Loader2, Phone,
    ShieldCheck, Trash2, RefreshCw, Key, AlertCircle, CheckCircle2, XCircle, Timer,
    Mail, Star, ShoppingCart, Package, ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';


// ===== API Key Bar (Hero-SMS) =====
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

// ===== SHOPVIA: Product Card =====
function ProductCard({
    product, isFav, onToggleFav, onBuy, buying
}: {
    product: ShopviaProduct;
    isFav: boolean;
    onToggleFav: () => void;
    onBuy: (qty: number) => void;
    buying: boolean;
}) {
    const [qty, setQty] = useState(Number(product.min) || 1);
    const [showPass, setShowPass] = useState(false);

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            {/* Star */}
            <button
                onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
                className="shrink-0 p-1 rounded-lg hover:bg-yellow-50 transition-colors"
            >
                <Star className={`h-4 w-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatVndPrice(product.price)}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        สต็อก: {product.amount}
                    </Badge>
                </div>
            </div>

            {/* Qty + Buy */}
            <div className="flex items-center gap-2 shrink-0">
                <Input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(Number(product.min) || 1, Number(e.target.value)))}
                    className="w-16 h-8 text-center text-sm"
                    min={Number(product.min) || 1}
                    max={Number(product.max) || product.amount}
                />
                <Button
                    size="sm"
                    onClick={() => onBuy(qty)}
                    disabled={buying || product.amount === 0 || qty < 1}
                    className="bg-emerald-600 hover:bg-emerald-700 h-8"
                >
                    {buying ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingCart className="h-3 w-3" />}
                </Button>
            </div>
        </div>
    );
}

// ===== SHOPVIA: Main Section =====
function ShopviaSection({ shopvia }: { shopvia: ReturnType<typeof useShopvia> }) {
    const [showAllProducts, setShowAllProducts] = useState(false);
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
    const [buyingProduct, setBuyingProduct] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<{ emails: { email: string; password: string }[]; productName: string } | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [showPasswords, setShowPasswords] = useState(false);
    const [shopviaKeyInput, setShopviaKeyInput] = useState(shopvia.apiKey);
    const [, setTick] = useState(0); // force re-render for countdown

    // Update countdown every minute
    useEffect(() => {
        if (shopvia.orders.length === 0) return;
        const interval = setInterval(() => setTick(t => t + 1), 60 * 1000);
        return () => clearInterval(interval);
    }, [shopvia.orders.length]);

    const getCountdown = (timestamp: number) => {
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const remaining = ONE_DAY - (Date.now() - timestamp);
        if (remaining <= 0) return 'หมดเวลา';
        const h = Math.floor(remaining / (60 * 60 * 1000));
        const m = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return `เหลือ ${h} ชม. ${m} น.`;
    };

    const handleBuy = async (product: ShopviaProduct, qty: number) => {
        setBuyingProduct(product.id);
        const result = await shopvia.buyProduct(product.id, product.name, qty, product.price);
        if (result.success) {
            setLastResult({ emails: result.emails, productName: product.name });
        }
        setBuyingProduct(null);
    };

    const copyAll = async () => {
        if (!lastResult) return;
        const text = lastResult.emails.map(e => `${e.email}|${e.password}`).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: 'คัดลอกทั้งหมดแล้ว!', description: `${lastResult.emails.length} รายการ` });
        } catch { }
    };

    const copyOne = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        } catch { }
    };

    const toggleCat = (catId: string) => {
        setExpandedCats(prev => {
            const next = new Set(prev);
            if (next.has(catId)) next.delete(catId);
            else next.add(catId);
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {/* Shopvia API Key Bar */}
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-blue-500" />
                            <span className="font-medium text-sm">Shopvia</span>
                        </div>
                        {!shopvia.connected ? (
                            <>
                                <Input
                                    type="password"
                                    placeholder="Shopvia API Key"
                                    value={shopviaKeyInput}
                                    onChange={(e) => setShopviaKeyInput(e.target.value)}
                                    className="flex-1 h-8 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && shopviaKeyInput.trim()) {
                                            shopvia.connect(shopviaKeyInput.trim());
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    onClick={() => shopvia.connect(shopviaKeyInput.trim())}
                                    disabled={!shopviaKeyInput.trim() || shopvia.loading.connect}
                                    className="bg-blue-600 hover:bg-blue-700 h-8"
                                >
                                    {shopvia.loading.connect ? <Loader2 className="h-3 w-3 animate-spin" /> : 'เชื่อมต่อ'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {shopvia.profile ? formatVndPrice(shopvia.profile.balance) : '...'}
                                </Badge>
                                <div className="ml-auto flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { shopvia.fetchProfile(); shopvia.fetchProducts(); }} disabled={shopvia.loading.profile || shopvia.loading.products}>
                                        <RefreshCw className={`h-3.5 w-3.5 ${(shopvia.loading.profile || shopvia.loading.products) ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={shopvia.disconnect} className="text-destructive h-7 text-xs">
                                        ตัดการเชื่อมต่อ
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
            {/* Profile / Balance */}
            {shopvia.connected && shopvia.profile && (
                <Card className="border-blue-500/20 bg-gradient-to-r from-background to-blue-500/5">
                    <CardContent className="pt-5 pb-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">เครดิตคงเหลือ</div>
                                    <div className="text-lg font-bold text-blue-600">
                                        {formatVndPrice(shopvia.profile.balance)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-muted-foreground">ประมาณ</div>
                                <div className="text-lg font-semibold text-emerald-600">
                                    {(() => {
                                        const vnd = Number(shopvia.profile.balance) || 0;
                                        const thb = vnd / 690;
                                        return `฿${thb.toFixed(2)}`;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Last Buy Result */}
            {lastResult && lastResult.emails.length > 0 && (
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                                ซื้อ {lastResult.productName} สำเร็จ ({lastResult.emails.length} รายการ)
                            </CardTitle>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => setShowPasswords(!showPasswords)}>
                                    {showPasswords ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button variant="outline" size="sm" onClick={copyAll}>
                                    <Copy className="h-3 w-3 mr-1" /> คัดลอกทั้งหมด
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setLastResult(null)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {lastResult.emails.map((e, i) => (
                                <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-background/50 text-xs font-mono">
                                    <span className="flex-1 truncate">{e.email}</span>
                                    <span className="text-muted-foreground">|</span>
                                    <span className="text-muted-foreground">{showPasswords ? e.password : '••••••'}</span>
                                    <Button
                                        variant="ghost" size="icon" className="h-5 w-5"
                                        onClick={() => copyOne(`${e.email}|${e.password}`, `email-${i}`)}
                                    >
                                        {copied === `email-${i}` ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Favorites */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            สินค้าโปรด ({shopvia.pinnedProducts.length})
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => shopvia.fetchProducts()} disabled={shopvia.loading.products}>
                            <RefreshCw className={`h-4 w-4 ${shopvia.loading.products ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {shopvia.loading.products && shopvia.pinnedProducts.length === 0 ? (
                        <div className="flex items-center justify-center p-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : shopvia.pinnedProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีสินค้าโปรด กดดาว ⭐ เพื่อเพิ่ม</p>
                    ) : (
                        <div className="space-y-2">
                            {shopvia.pinnedProducts.map(p => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    isFav={true}
                                    onToggleFav={() => shopvia.toggleFavorite(p.id)}
                                    onBuy={(qty) => handleBuy(p, qty)}
                                    buying={buyingProduct === p.id}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* All Products Toggle */}
            <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAllProducts(!showAllProducts)}
            >
                {showAllProducts ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                {showAllProducts ? 'ซ่อนสินค้าทั้งหมด' : `ดูสินค้าทั้งหมด (${shopvia.allProducts.length})`}
            </Button>

            {/* All Products by Category */}
            {showAllProducts && shopvia.categories.map(cat => (
                <Card key={cat.id}>
                    <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleCat(cat.id)}>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                                {cat.icon && <img src={cat.icon} alt="" className="h-5 w-5 rounded" />}
                                {cat.name}
                                <Badge variant="secondary" className="text-[10px]">{cat.products.length}</Badge>
                            </CardTitle>
                            {expandedCats.has(cat.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                    </CardHeader>
                    {expandedCats.has(cat.id) && (
                        <CardContent>
                            <div className="space-y-2">
                                {cat.products.map(p => (
                                    <ProductCard
                                        key={p.id}
                                        product={p}
                                        isFav={shopvia.isFavorite(p.id)}
                                        onToggleFav={() => shopvia.toggleFavorite(p.id)}
                                        onBuy={(qty) => handleBuy(p, qty)}
                                        buying={buyingProduct === p.id}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    )}
                </Card>
            ))}

            {/* Order History */}
            {shopvia.orders.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                ประวัติซื้อ ({shopvia.orders.length})
                            </CardTitle>
                            <Button
                                variant="outline" size="sm"
                                onClick={() => shopvia.saveOrders([])}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-3 w-3 mr-1" /> ล้าง
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {shopvia.orders.map((order, i) => (
                                <div key={i} className="rounded-lg border bg-muted/30 overflow-hidden">
                                    <div
                                        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => {
                                            const el = document.getElementById(`order-detail-${i}`);
                                            if (el) el.classList.toggle('hidden');
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{order.productName}</span>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(order.timestamp).toLocaleString('th-TH', {
                                                        month: 'short', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                                                    ⏳ {getCountdown(order.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>จำนวน: {order.qty}</span>
                                            <span>•</span>
                                            <span className={order.emails.length > 0 ? 'text-emerald-600 font-medium' : ''}>
                                                ได้รับ: {order.emails.length} รายการ
                                            </span>
                                            <span>•</span>
                                            <span>{formatVndPrice(order.totalCost)}</span>
                                            <ChevronDown className="h-3 w-3 ml-auto" />
                                        </div>
                                    </div>
                                    <div id={`order-detail-${i}`} className="hidden border-t px-3 pb-3 pt-2">
                                        {order.emails.length > 0 ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-muted-foreground">รายการเมล์ที่ได้รับ:</span>
                                                    <Button
                                                        variant="outline" size="sm" className="h-6 text-[10px]"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const text = order.emails.map(e => e.password ? `${e.email}|${e.password}` : e.email).join('\n');
                                                            navigator.clipboard.writeText(text);
                                                            toast({ title: 'คัดลอกทั้งหมดแล้ว!', description: `${order.emails.length} รายการ` });
                                                        }}
                                                    >
                                                        <Copy className="h-2.5 w-2.5 mr-1" /> คัดลอกทั้งหมด
                                                    </Button>
                                                </div>
                                                <div className="max-h-[150px] overflow-y-auto space-y-1">
                                                    {order.emails.map((e, j) => (
                                                        <div key={j} className="flex items-center gap-2 p-1.5 rounded bg-background/50 text-xs font-mono">
                                                            <span className="flex-1 truncate">{e.email}</span>
                                                            {e.password && (
                                                                <>
                                                                    <span className="text-muted-foreground">|</span>
                                                                    <span className="text-muted-foreground">{e.password}</span>
                                                                </>
                                                            )}
                                                            <Button
                                                                variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                                                                onClick={(ev) => {
                                                                    ev.stopPropagation();
                                                                    const text = e.password ? `${e.email}|${e.password}` : e.email;
                                                                    navigator.clipboard.writeText(text);
                                                                    toast({ title: 'คัดลอกแล้ว!' });
                                                                }}
                                                            >
                                                                <Copy className="h-2.5 w-2.5" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">ไม่มีข้อมูลเมล์</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ===== MAIN PAGE =====
export default function App() {
    const sms = useHeroSMS();
    const shopvia = useShopvia();
    const [mainSection, setMainSection] = useState<'sms' | 'mail'>('sms');
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
                    {mainSection === 'sms' ? (
                        <Smartphone className="h-6 w-6 text-white" />
                    ) : (
                        <Mail className="h-6 w-6 text-white" />
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {mainSection === 'sms' ? 'Hero-SMS Client' : 'ร้านค้าเมล'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {mainSection === 'sms' ? 'จัดการเบอร์ SMS ชั่วคราว' : 'Shopvia1s — ซื้อเมลสำเร็จรูป'}
                    </p>
                </div>
                {mainSection === 'sms' && sms.connected && (
                    <Button variant="ghost" size="icon" className="ml-auto" onClick={sms.fetchBalance} disabled={sms.loading.balance}>
                        <RefreshCw className={`h-4 w-4 ${sms.loading.balance ? 'animate-spin' : ''}`} />
                    </Button>
                )}
            </div>

            {/* Main Section Navigation */}
            <div className="flex gap-2">
                <Button
                    variant={mainSection === 'sms' ? 'default' : 'outline'}
                    onClick={() => setMainSection('sms')}
                    className="flex-1"
                >
                    <Smartphone className="h-4 w-4 mr-2" />
                    SMS
                    {sms.activeOrder && <span className="ml-2 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                </Button>
                <Button
                    variant={mainSection === 'mail' ? 'default' : 'outline'}
                    onClick={() => setMainSection('mail')}
                    className="flex-1"
                >
                    <Mail className="h-4 w-4 mr-2" />
                    ร้านเมล
                    {shopvia.connected && shopvia.profile && (
                        <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                            {formatVndPrice(shopvia.profile.balance).split(' ')[0]} ₫
                        </Badge>
                    )}
                </Button>
            </div>

            {/* SMS Section */}
            {mainSection === 'sms' && (
                <>
                    <ApiKeyBar
                        apiKey={sms.apiKey}
                        onConnect={sms.connect}
                        onDisconnect={sms.disconnect}
                        connected={sms.connected}
                        balance={sms.balance}
                        loading={sms.loading.connect}
                    />

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
                </>
            )}

            {/* Mail Section */}
            {mainSection === 'mail' && (
                <ShopviaSection shopvia={shopvia} />
            )}


        </div>
    );
}
