# 🚀 Hero-SMS Client — คู่มือ Deployment สำหรับเพื่อน

## สรุปภาพรวม

Hero-SMS Client เป็นแอพ standalone สำหรับจัดการเบอร์ SMS ชั่วคราว ผ่าน hero-sms.com API  
แอพนี้ถูก deploy **แยกออกจากแอพหลัก** เพื่อให้เพื่อนเข้าใช้งานได้โดยตรง

---

## 📍 ที่อยู่ต่างๆ

| รายการ | ที่อยู่ |
|--------|---------|
| **เว็บเพื่อนเข้าใช้** | `http://203.154.83.192:3300` |
| **VPS IP** | `203.154.83.192` |
| **VPS Provider** | OpenLandscape (openlandscape.cloud) |
| **GitHub Repo** | `https://github.com/welovename555/apiname` |
| **GitHub Account** | `welovename555` |
| **โค้ดบน Mac** | `/Users/air/Desktop/Anti/my-product-tag-creator/hero-sms-client/` |
| **โค้ดบน VPS** | `/var/www/hero-sms/` |
| **PM2 Process Name** | `hero-sms-friend` |
| **Port** | `3300` |

---

## 🏗️ โครงสร้างระบบ

```
เพื่อนเปิดเบราว์เซอร์
     │
     ▼
http://203.154.83.192:3300   ←── VPS (server.cjs รันด้วย PM2)
     │
     ├── Static files (dist/)  ←── หน้าเว็บ React
     │
     └── /api/hero-sms         ←── Proxy ไป hero-sms.com API
              │
              ▼
     https://hero-sms.com/stubs/handler_api.php
```

---

## 🔧 วิธีแก้ไขและอัพเดท

### 1. แก้โค้ดบน Mac
```bash
# เปิดโปรเจค
cd /Users/air/Desktop/Anti/my-product-tag-creator/hero-sms-client

# แก้ไขไฟล์ที่ต้องการ เช่น:
# - src/App.tsx          → หน้า UI หลัก
# - src/hooks/useHeroSMS.ts → Logic API ทั้งหมด
# - server.cjs           → Server proxy + CORS
```

### 2. Build + Push ขึ้น GitHub
```bash
cd /Users/air/Desktop/Anti/my-product-tag-creator/hero-sms-client
npm run build
git add -A
git commit -m "อธิบายสิ่งที่แก้"
git push origin main
```

### 3. อัพเดทบน VPS
```bash
# SSH เข้า VPS
ssh root@203.154.83.192
# (ใส่รหัสผ่าน)

# Pull + Build + Restart
cd /var/www/hero-sms
git pull origin main
npm run build
pm2 restart hero-sms-friend
```

---

## 🔑 ข้อมูลสำคัญ

### GitHub Authentication
- ใช้ Personal Access Token (PAT) ของ `welovename555`
- Token ถูกตั้งค่าไว้ใน Git credential แล้ว
- ถ้า Token หมดอายุ: ไป GitHub → Settings → Developer Settings → Personal Access Tokens → สร้างใหม่

### VPS (OpenLandscape)
- **SSH:** `ssh root@203.154.83.192`
- **Security Group:** เพิ่ม `HeroSMSfriend` สำหรับ port 3300 แล้ว
- **Firewall (UFW):** port 3300 เปิดแล้ว
- ถ้าต้องเปลี่ยน port: ต้องเปิดทั้ง UFW และ Security Group ที่ OpenLandscape

### PM2 Commands
```bash
pm2 list                        # ดู process ทั้งหมด
pm2 logs hero-sms-friend        # ดู log
pm2 restart hero-sms-friend     # restart
pm2 stop hero-sms-friend        # หยุด
pm2 delete hero-sms-friend      # ลบ
pm2 save                        # บันทึก process list
```

---

## 📁 ไฟล์สำคัญ

| ไฟล์ | หน้าที่ |
|------|---------|
| `server.cjs` | Express server — serve static + proxy API + CORS |
| `src/App.tsx` | หน้า UI หลัก |
| `src/hooks/useHeroSMS.ts` | Logic เชื่อมต่อ API ทั้งหมด |
| `src/index.css` | Styling + Design Tokens |
| `vite.config.ts` | Vite config (base path = `/`) |
| `package.json` | Dependencies |

---

## ⚙️ ฟีเจอร์ที่ตั้งค่าไว้

- ✅ API Proxy ผ่าน VPS (ไม่เปิดเผย API Key ให้ client)
- ✅ CORS อนุญาต localhost + github.io
- ✅ Auto-connect เมื่อเปิดแอพ (ถ้าเคยใส่ API Key)
- ✅ Auto-delete ประวัติเก่ากว่า 24 ชั่วโมง
- ✅ Auto-cancel เบอร์หลังหมดเวลา 15 นาที
- ✅ Poll OTP ทุก 5 วินาที

---

## 🆘 แก้ปัญหาที่พบบ่อย

### เว็บเข้าไม่ได้ (ERR_CONNECTION_REFUSED)
```bash
ssh root@203.154.83.192
pm2 list                    # เช็คว่า hero-sms-friend ยัง online ไหม
pm2 restart hero-sms-friend # restart
pm2 logs hero-sms-friend    # ดู error log
```

### เว็บเข้าไม่ได้ (ERR_CONNECTION_TIMED_OUT)
- Port ถูกบล็อก → ไปเช็ค Security Group ที่ OpenLandscape
- ตรวจสอบ: `ufw status` บน VPS

### API Error / Failed to fetch
```bash
# ทดสอบ API บน VPS
curl http://localhost:3300/api/hero-sms?action=getBalance
# ถ้าไม่ได้ → ดู log
pm2 logs hero-sms-friend --lines 30
```

### ต้องเปลี่ยน Port
```bash
pm2 delete hero-sms-friend
PORT=ใหม่ pm2 start server.cjs --name "hero-sms-friend"
pm2 save
# + เปิด port ที่ UFW: ufw allow PORT_ใหม่
# + เพิ่ม Security Group ที่ OpenLandscape
```
