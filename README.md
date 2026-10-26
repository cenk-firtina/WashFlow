# 🚗 WashFlow — Oto Yıkama İş Takip & WhatsApp Bildirim Sistemi

İş takip, canlı durum panosu (Kanban), müşteri canlı takip sayfası ve otomatik **WhatsApp**
bildirim sistemi. **cPanel (CloudLinux Passenger + Node.js + MySQL)** üzerinde, harici
Redis/Socket.io **olmadan** çalışacak şekilde tasarlandı.

- **Canlı güncelleme:** Kısa aralıklı polling (pano 5 sn, takip sayfası 5 sn).
- **Mesaj kuyruğu & hatırlatıcılar:** MySQL tabanlı `message_queue` + cPanel Cron ile tetiklenen CLI worker.
- **WhatsApp:** Meta **WhatsApp Cloud API** (resmî) ile onaylı template mesajları.

## Teknoloji
| Katman | Teknoloji |
|---|---|
| Backend | Node.js (TypeScript), Express, Prisma ORM (MySQL), JWT |
| Frontend | React + Vite + TypeScript, Tailwind CSS, TanStack Query, Axios, Lucide |
| Mesajlaşma | Modüler `WhatsAppService` (Mock + Meta Cloud API) |

## Proje Yapısı
```
washflow/
├─ server/                 # Backend (Express + Prisma)
│  ├─ prisma/schema.prisma # Veritabanı şeması
│  ├─ prisma/seed.ts       # Başlangıç verisi
│  ├─ src/
│  │  ├─ app.ts, index.ts  # Express app (API + client build servisi)
│  │  ├─ modules/          # auth, customers, vehicles, services, tickets, tracking, settings, dashboard
│  │  ├─ services/         # WhatsAppService + mesaj kuyruğu + ayarlar
│  │  ├─ middleware/       # JWT auth, hata yönetimi
│  │  └─ utils/            # metin, plaka/telefon normalize, kod üretimi
│  └─ scripts/cron-worker.ts  # cPanel Cron CLI (retention + gönderim)
├─ client/                 # Frontend (React)
│  └─ src/pages/           # Login, Intake, Board (Kanban), Tracking, Dashboard, Settings
└─ .htaccess               # cPanel Passenger şablonu
```

---

## 🧪 Lokal Geliştirme

```bash
# 1) Backend
cd server
cp .env.example .env          # DATABASE_URL + JWT_SECRET doldurun (WHATSAPP_PROVIDER=mock)
npm install
npx prisma migrate dev --name init
npm run seed                  # admin@washflow.local / admin123
npm run dev                   # http://localhost:4000

# 2) Frontend (ayrı terminal)
cd client
npm install
npm run dev                   # http://localhost:5173  (/api -> 4000 proxy)
```

Giriş: **admin@washflow.local / admin123** (ADMIN) veya **operator@washflow.local / operator123**.

WhatsApp mesajları `mock` modda gerçekten gitmez; konsola yazılır. Kuyruğu işlemek için:
```bash
cd server && npm run cron:worker:dev          # retention + gönderim
# sadece gönderim: npm run cron:worker:dev -- --send-only
```

---

## 🚀 cPanel'e Deploy (Adım Adım)

### 1. MySQL veritabanı
cPanel → **MySQL Databases**: bir DB + kullanıcı oluşturun, kullanıcıyı DB'ye tam yetkiyle ekleyin.
`DATABASE_URL`: `mysql://cpaneluser_dbuser:ŞİFRE@localhost:3306/cpaneluser_dbname`

### 2. Dosyaları yükleyin
Projeyi `~/washflow` altına yükleyin (Git ile `git clone` veya File Manager/FTP).

### 3. Frontend build'ini alın
Build'i **lokalde** alıp `client/dist`'i yüklemek en pratiğidir (cPanel'de bellek sınırı olabilir):
```bash
cd client && npm install && npm run build      # client/dist üretir
```
> Not: `PUBLIC_BASE_URL` takip linklerinde kullanılır, API'de okunur; client build'i origin-bağımsız (`/api`) çalıştığı için build öncesi ayara gerek yoktur.

### 4. Node.js App oluşturun
cPanel → **Setup Node.js App** → Create Application:
- **Node version:** 18 veya üzeri
- **Application root:** `washflow/server`
- **Application URL:** alan adınız / subdomain
- **Application startup file:** `dist/index.js`

### 5. Bağımlılık + build (uygulamanın terminalinde)
cPanel Node App panelinde **"Run NPM Install"**, ardından **"Enter to the virtual environment"** komutunu kopyalayıp SSH/Terminal'de:
```bash
source /home/KULLANICI/nodevenv/washflow/server/18/bin/activate && cd ~/washflow/server
npm install
npm run build                 # prisma generate + tsc -> dist/
npx prisma migrate deploy     # tabloları oluşturur
npm run seed                  # ilk kullanıcılar + hizmetler + ayarlar
```

### 6. Ortam değişkenleri
cPanel Node App panelinde **Environment Variables** bölümüne `.env.example`'daki değerleri girin
(veya `server/.env` dosyası oluşturun). En az: `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_BASE_URL`,
`WHATSAPP_PROVIDER` (`cloud`), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`.

### 7. Uygulamayı başlatın
Panelden **Restart**. `https://alanadi/api/health` → `{ "ok": true }` dönmeli.
React arayüzü `https://alanadi/` adresinde açılır; takip sayfası `https://alanadi/t/<token>`.

### 8. Cron Job (WhatsApp kuyruğu + hatırlatıcılar)
cPanel → **Cron Jobs**. İki öneri:

**a) Günlük retention + gönderim (örn. her gün 10:00):**
```
0 10 * * *  source /home/KULLANICI/nodevenv/washflow/server/18/bin/activate && cd ~/washflow/server && node dist/scripts/cron-worker.js >> ~/washflow/cron.log 2>&1
```

**b) Sık gönderim (kuyruğu hızlı boşaltmak için, örn. 10 dk'da bir — opsiyonel):**
```
*/10 * * * *  source /home/KULLANICI/nodevenv/washflow/server/18/bin/activate && cd ~/washflow/server && node dist/scripts/cron-worker.js --send-only >> ~/washflow/cron.log 2>&1
```
`KULLANICI` ve node sürüm yolunu kendi hesabınıza göre düzeltin (doğru yolu cPanel Node App panelindeki "activate" komutundan kopyalayın).

---

## 📡 API Özeti
| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/login` | Giriş (JWT) |
| GET | `/api/auth/me` | Oturum bilgisi |
| GET | `/api/vehicles/lookup?plate=` | Plakadan müşteri/araç ön-doldurma |
| GET | `/api/services` | Hizmet listesi |
| POST | `/api/tickets` | Araç kabul (bilet aç + INTAKE WhatsApp) |
| GET | `/api/tickets/board` | Kanban aktif biletler (polling) |
| PATCH | `/api/tickets/:id/status` | Durum ilerlet (READY → READY WhatsApp) |
| GET | `/api/tracking/:token` | **Public** canlı takip |
| GET | `/api/customers` · POST | Müşteri arama / oluşturma |
| GET/PATCH | `/api/settings` | WhatsApp toggle + template ayarları (ADMIN) |
| GET | `/api/dashboard/summary` · `/api/dashboard/messages` | Ciro, araç, WhatsApp logları |

## 🔔 WhatsApp Bildirim Akışı
1. **INTAKE** — bilet açılınca (toggle açıksa) kuyruğa.
2. **READY** — durum `READY` olunca kuyruğa.
3. **RETENTION** — cron: son ziyareti ≥ eşik (25) gün önce, aktif bileti olmayan, son 30 günde
   hatırlatma almamış, pazarlama izni olan araç sahiplerine.

Numaralar uluslararası formata çevrilir (`05xx` → `905xx`). Mesajlar Meta WhatsApp Cloud API
**template** olarak gider; panelde/loglarda okunur önizleme metni de saklanır.

### ⚠️ WhatsApp Cloud API ön koşulları (önemli)
İşletme-başlatan mesajlar **önceden onaylı template** gerektirir — serbest metin gönderilemez.
Deploy öncesi Meta Business'ta şunları yapın:
1. **Meta Business + WhatsApp Business hesabı** açın, bir telefon numarası ekleyip doğrulayın.
2. **API Setup**'tan `WHATSAPP_PHONE_NUMBER_ID` ve kalıcı (System User) `WHATSAPP_ACCESS_TOKEN` alın.
3. Her bildirim için **template oluşturup onaylatın** (Utility/Marketing). Body parametre sırası:
   - **INTAKE** → `{{1}}` ad · `{{2}}` plaka · `{{3}}` saat · `{{4}}` takip linki
   - **READY** → `{{1}}` ad · `{{2}}` plaka
   - **RETENTION** → `{{1}}` plaka
4. Onaylanan template **adlarını** ve dil kodunu uygulamadaki **Ayarlar** ekranına girin
   (varsayılan: `intake_notification` / `ready_notification` / `retention_notification`, dil `tr`).
5. `.env`'de `WHATSAPP_PROVIDER=cloud` yapın.

> Yeni template'lerin Meta onayı birkaç dakika–saat sürebilir. Onaya kadar `mock` modda test edin.

## 🔐 İlk Kurulum Sonrası
- Seed şifrelerini **mutlaka değiştirin** (yeni admin ekleyip eskisini silin veya şifre hash'ini güncelleyin).
- `JWT_SECRET`'i uzun ve rastgele yapın.
- Gerçek WhatsApp gönderimi için `WHATSAPP_PROVIDER=cloud` + Meta bilgileri + onaylı template'ler (yukarıya bakın).
