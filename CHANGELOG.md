# Hero-SMS Client (ของเพื่อน) — บันทึกการแก้ไข

> **โปรเจคนี้อยู่ใน:** `hero-sms-client/`
> **Deploy อยู่ที่:** VPS `203.154.83.192` → `/var/www/hero-sms/`
> **PM2 process:** `hero-sms-friend` (port 3300)
> **เว็บ:** `https://name.kimmer.site`

---

## 2026-02-10: แก้ Shopvia Buy + เพิ่ม Features

### 🔧 แก้ไข Shopvia Buy API (server.cjs)

**ปัญหา:** กดซื้อแล้ว error "Request does not exist" หรือ "ID สินค้าไม่ถูกต้อง"

**สาเหตุ:** API docs เขียน param เป็นตัวใหญ่ (`ID`, `Amount`) แต่ API จริงต้องใช้ **ตัวเล็ก** (`id`, `amount`)

**แก้ไขใน `server.cjs`:**
```javascript
// ❌ เดิม (ไม่ทำงาน)
formData.append('action', 'buy');
formData.append('ID', productId);
formData.append('Amount', String(amount));

// ✅ แก้แล้ว (ทำงานได้)
formData.append('action', 'buyProduct');
formData.append('id', productId);
formData.append('amount', String(amount || 1));
formData.append('coupon', '');
formData.append('api_key', key);
```

### 🔧 แก้ API Key & Profile Parsing (useShopvia.ts)

- เพิ่ม `encodeURIComponent()` ให้ API key ใน URL
- แก้ profile mapping: ใช้ `data.data.money` แทน `data.balance`
- แก้ buy response parsing: รองรับ `data[]` array ของ email strings
- แก้ validation: เช็ค `raw.status === 'error'`

### ✨ เพิ่ม Features

1. **เครดิตแสดงเด่น** — แสดง VND + THB ขนาดใหญ่ (App.tsx)
2. **ประวัติซื้อกดขยาย** — คลิกเพื่อดู email ที่ซื้อ + ปุ่มคัดลอก (App.tsx)
3. **Countdown ลบอัตโนมัติ** — แต่ละ order แสดง "⏳ เหลือ X ชม. Y น." ลบเองเมื่อครบ 24 ชม.

---

## ไฟล์สำคัญ

| ไฟล์ | หน้าที่ |
|------|---------|
| `server.cjs` | Express proxy → Shopvia API (profile, products, buy, orders) |
| `src/hooks/useShopvia.ts` | Hook จัดการ state: API key, profile, products, favorites, orders |
| `src/App.tsx` | UI ทั้งหมด (SMS tab + ร้านเมล tab) |

## วิธี Deploy

```bash
cd ~/Desktop/Anti/my-product-tag-creator/hero-sms-client
npx vite build
scp -r dist server.cjs root@203.154.83.192:/var/www/hero-sms/
ssh root@203.154.83.192 "pm2 restart hero-sms-friend"
```

## Shopvia API Notes

- **Base URL:** `https://shopvia1s.com/api`
- **Profile:** `GET /profile.php?api_key=...`
- **Products:** `GET /products.php?api_key=...`
- **Buy:** `POST /buy_product` (form-data: `action=buyProduct`, `id`, `amount`, `coupon`, `api_key`)
- ⚠️ **สำคัญ:** param ต้องเป็น **ตัวเล็กทั้งหมด** (`id`, `amount`, `coupon`) ไม่ใช่ตัวใหญ่ตาม docs!
