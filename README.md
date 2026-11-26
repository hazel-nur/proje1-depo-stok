# Depo/Stok Yönetim Sistemi

Çok şubeli bir işletmenin depo ve stok süreçlerini yöneten **backend (NestJS) + web (Next.js)** uygulaması:
depo başına stok, stok giriş/çıkış/transfer, onaylı transfer talebi, satın alma talebi (teslim alınca stok artar),
stok sayımı, düşük stok uyarısı ve Admin paneli.

## Teknoloji

| Katman | Teknoloji |
| --- | --- |
| Backend | NestJS 12 (TypeScript), Prisma 7 (`prisma-client` generator + `PrismaPg` adapter), PostgreSQL |
| Kimlik | JWT access (15 dk) + refresh (7 gün, rotation), bcrypt, rol bazlı yetki (RolesGuard) |
| Güvenlik | `@nestjs/throttler`, ValidationPipe (whitelist), CORS, tek biçimli hata gövdesi `{ error, code }` |
| API dokümanı | Swagger / OpenAPI (`/api`) |
| Web | Next.js 16 (App Router), Tailwind CSS 4, React Query, axios; token'lar **httpOnly cookie**'de |
| Test | Jest (birim, 33 test), Node test runner + supertest (e2e duman), `backend/scripts/smoke.sh` (curl, 70 kontrol) |

**Mimari:** Katmanlı (`Controller → Service → Repository → DTO`) ve *Package by Feature* (her özellik kendi klasöründe).
Silme işlemleri **soft delete** (`deletedAt`) yapılır; Admin silinenleri listeler, geri alır (restore) veya kalıcı siler (hard delete).

## Hızlı kurulum (yerel)

Gereksinimler: Node 22+, PostgreSQL (varsayılan: `postgres/postgres@localhost:5432`, veritabanı `depo_stok_db`).

```bash
createdb -U postgres depo_stok_db            # veritabanını oluşturun

# --- Backend ---
cd backend
cp .env.example .env                         # DATABASE_URL ve JWT_* değerlerini kontrol edin
npm ci
npm run prisma:generate                      # = prisma generate --config prisma7.config.ts
npm run prisma:deploy                        # migration'ları uygular (geliştirmede: npm run prisma:migrate)
npm run seed                                 # 4 rol için kullanıcı + örnek veri
npm run start:dev                            # API: http://localhost:3000   Swagger: http://localhost:3000/api

# --- Web (yeni terminal) ---
cd web
cp .env.example .env.local                   # BACKEND_URL=http://localhost:3000
npm ci
npm run dev                                  # http://localhost:3100
```

Backend portu `PORT` ortam değişkeninden okunur, tanımlı değilse **3000**'dir (test için 3001 kullanılabilir: `PORT=3001`;
o zaman web tarafında `BACKEND_URL=http://localhost:3001` verin). Web her zaman **3100** portunda çalışır.

> Prisma komutları `backend/` klasöründen çalıştırılır; `prisma7.config.ts` içindeki `DATABASE_URL`'i `.env`'den okur.

### Örnek kullanıcılar (seed)

| Rol | E-posta | Şifre |
| --- | --- | --- |
| Admin | admin@depo.com | Admin123! |
| Şube Yöneticisi | sube@depo.com | Sube123! |
| Satın Alma Sorumlusu | satinalma@depo.com | Satin123! |
| Depo Personeli | depo@depo.com | Depo123! |

Bu şifreler yalnızca geliştirme içindir; üretimde değiştirin ve `JWT_*` anahtarlarını rastgele üretin.

### Docker ile

```bash
docker compose up --build        # postgres + backend (3000) + web (3100)
docker compose exec backend npm run seed
```

**Dürüst not:** Bu dosyaların yazıldığı ortamda Docker daemon yoktu. `backend/Dockerfile`, `web/Dockerfile` ve
`docker-compose.yml` **yazıldı ancak imajlar build edilemedi, konteynerler çalıştırılamadı**. Docker'sız parçalar
(Next.js `standalone` çıktısı ile `server.js`, derleme komutları) ayrı ayrı denendi; imaj düzeyi doğrulama sizde yapılmalı.
Backend konteyneri açılışta `prisma migrate deploy` çalıştırır (Prisma'nın schema-engine binary'sini indirebilmek için internet gerekir).

## Ortam değişkenleri

`backend/.env.example` ve `web/.env.example` dosyalarına bakın. `.env` dosyaları repoya **eklenmez** (`.gitignore`).

| Değişken | Açıklama |
| --- | --- |
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Access / refresh token imza anahtarları (farklı olmalı) |
| `PORT` | API portu (yoksa 3000) |
| `CORS_ORIGIN` | İzinli web adresleri (virgülle ayrılır) |
| `THROTTLE_LIMIT`, `AUTH_THROTTLE_LIMIT` | IP başına dakikalık istek sınırı (genel / giriş-yenileme) |
| `TRUST_PROXY` | Ters vekil arkasında gerçek IP için (`1`) |
| `BACKEND_URL` (web) | Web sunucusunun backend'e bağlandığı adres (tarayıcıya gitmez) |
| `COOKIE_SECURE` (web) | HTTPS yayında `true` |

## Roller ve yetki matrisi

Roller: **Depo Personeli**, **Satın Alma Sorumlusu**, **Şube Yöneticisi**, **Admin**.
(✓ = izinli, – = yasak; yetkisiz istek `403`, token yoksa `401` döner.)

| İşlem | Depo P. | Satın Alma | Şube Y. | Admin |
| --- | :-: | :-: | :-: | :-: |
| Ürün / kategori / depo / tedarikçi / stok durumu / stok hareketi **okuma** | ✓ | ✓ | ✓ | ✓ |
| Ürün oluştur / güncelle | – | ✓ | ✓ | ✓ |
| Kategori, depo oluştur / güncelle / soft delete | – | – | ✓ | ✓ |
| Tedarikçi oluştur / güncelle | – | ✓ | ✓ | ✓ |
| Ürün, tedarikçi soft delete | – | – | ✓ | ✓ |
| Stok **giriş / çıkış** | ✓ | – | ✓ | ✓ |
| Doğrudan **transfer** (onaysız) | – | – | ✓ | ✓ |
| Transfer talebi aç / listele / iptal (Depo P. sadece kendi talebini) | ✓ | – | ✓ | ✓ |
| Transfer talebi **onayla / reddet** | – | – | ✓ | ✓ |
| Satın alma talebi oluştur | – | ✓ | ✓ | ✓ |
| Satın alma talebi **onayla / reddet** | – | – | ✓ | ✓ |
| Satın alma **teslim al** (stok artar) | ✓ | – | ✓ | ✓ |
| Satın alma iptal (Satın Alma sadece kendi talebini) | – | ✓ | ✓ | ✓ |
| Sayım oluştur / güncelle / listele | ✓ | – | ✓ | ✓ |
| Sayım **uygula** (stok düzeltilir) | – | – | ✓ | ✓ |
| Transfer / satın alma / sayım soft delete | – | – | ✓ | ✓ |
| Silinenleri listele (`/deleted`), **restore**, **hard delete** | – | – | – | ✓ |
| Kullanıcı oluştur / listele / rol değiştir / sil | – | – | – | ✓ |
| `GET /admin/stats` ve Admin paneli | – | – | – | ✓ |

Notlar: Herkese açık `POST /auth/register` rol alanını yok sayar, her zaman **Depo Personeli** üretir; yüksek yetkili
hesapları yalnızca Admin oluşturur (`POST /users`). Son Admin silinemez, kimse kendi rolünü değiştiremez/kendini silemez.
Stok hareketleri bir **denetim defteridir**: değiştirilmez ve silinmez.

## İş kuralları (kısa)

- `Product.stokMiktari` = tüm depoların toplamı; **sadece stok hareketiyle** değişir (ürün güncellerken gönderilse bile yok sayılır).
- Giriş/çıkış/transfer **tek veritabanı transaction'ında** çalışır: depo stoğu + ürün toplamı + hareket kaydı birlikte yazılır, biri hata verirse hepsi geri alınır. Çıkışta stok eksiye düşemez (`409`).
- **Transfer talebi:** Depo Personeli açar (`BEKLIYOR`) → Şube Yöneticisi/Admin onaylar (transfer aynı transaction'da uygulanır; yetersiz stokta onay geri alınır) ya da reddeder.
- **Satın alma:** oluştur (`BEKLIYOR`) → onayla (`ONAYLANDI`) → teslim al (`TESLIM_ALINDI`, kalemler hedef depoya giriş olur). Toplam tutar kalemlerden hesaplanır.
- **Sayım:** kalemler girilir; beklenen miktar depodan alınır; `fark = sayılan (gerçek) − beklenen`. Uygulanınca fark kadar `GIRIS`/`CIKIS` hareketi yazılır.
- **Düşük stok:** toplam stok `minStokSeviyesi` değerinin altındaysa listelenir (`GET /warehouse-stocks/low`).
- **Refresh token:** her yenilemede yeni çift üretilir, eski refresh token geçersiz olur; eski token tekrar kullanılırsa oturum kapatılır. Veritabanında yalnızca SHA-256 özeti tutulur (`User.refreshTokenHash`).
- **Silme kuralları:** içinde stok olan depo / açık talebi olan tedarikçi / aktif ürünü olan kategori soft delete edilemez; hareket-talep geçmişi olan depo veya tedarikçi hard delete edilemez.

## API listesi

Tüm uçlar Swagger'da (`/api`) ve `Authorization: Bearer <access_token>` ile çalışır (auth uçları hariç).
Her kaynakta `GET /x/deleted` (Admin) `GET /x/:id`'den **önce** tanımlıdır; `DELETE /x/:id` soft, `DELETE /x/:id/hard` yalnızca Admin içindir.

| Grup | Uçlar |
| --- | --- |
| **auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/admin-test` |
| **users** (Admin) | `POST /users`, `GET /users`, `GET /users/deleted`, `GET /users/:id`, `PATCH /users/:id/role`, `PATCH /users/:id/restore`, `DELETE /users/:id`, `DELETE /users/:id/hard` |
| **categories** | `POST/GET /categories`, `GET /categories/deleted`, `GET/PATCH/DELETE /categories/:id`, `PATCH /categories/:id/restore`, `DELETE /categories/:id/hard` |
| **products** | `POST/GET /products`, `GET /products/deleted`, `GET/PATCH/DELETE /products/:id`, `PATCH /products/:id/restore`, `DELETE /products/:id/hard` |
| **warehouses** | `POST/GET /warehouses`, `GET /warehouses/deleted`, `GET/PATCH/DELETE /warehouses/:id`, `PATCH /warehouses/:id/restore`, `DELETE /warehouses/:id/hard` |
| **suppliers** | `POST/GET /suppliers`, `GET /suppliers/deleted`, `GET/PATCH/DELETE /suppliers/:id`, `PATCH /suppliers/:id/restore`, `DELETE /suppliers/:id/hard` |
| **warehouse-stocks** | `GET /warehouse-stocks?warehouseId=&productId=`, `GET /warehouse-stocks/low` |
| **stock-movements** | `POST /stock-movements/entry`, `POST /stock-movements/exit`, `POST /stock-movements/transfer`, `GET /stock-movements?tip=&productId=&warehouseId=&limit=`, `GET /stock-movements/:id` |
| **transfer-requests** | `POST/GET /transfer-requests?durum=`, `GET /transfer-requests/deleted`, `GET/DELETE /transfer-requests/:id`, `PATCH …/:id/approve`, `…/reject`, `…/cancel`, `…/restore`, `DELETE …/:id/hard` |
| **purchase-requests** | `POST/GET /purchase-requests?durum=`, `GET /purchase-requests/deleted`, `GET/DELETE /purchase-requests/:id`, `PATCH …/:id/approve`, `…/reject`, `…/receive`, `…/cancel`, `…/restore`, `DELETE …/:id/hard` |
| **inventory-counts** | `POST/GET /inventory-counts`, `GET /inventory-counts/deleted`, `GET/PATCH/DELETE /inventory-counts/:id`, `PATCH …/:id/apply`, `…/restore`, `DELETE …/:id/hard` |
| **admin** | `GET /admin/stats` |
| **app** | `GET /`, `GET /health` |

**Hata biçimi:** `{ "error": "Okunabilir mesaj", "code": "NOT_FOUND" }` — kodlar: `VALIDATION_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR`.

## Web arayüzü

Giriş sayfası, rol bazlı menü, panel (istatistikler), ürün / kategori / depo / tedarikçi sayfaları, stok durumu (+ düşük stok),
stok hareketleri, transfer talepleri, satın alma, sayımlar ve **Admin paneli** (kullanıcılar + rol değiştirme, silinenler /
geri alma / kalıcı silme, istatistikler). Mobil uyumludur (hamburger menü, kaydırılabilir tablolar).

Oturum: tarayıcı backend'e **doğrudan gitmez**. `POST /api/auth/login` Next.js route handler'ı token'ları **httpOnly cookie**'ye yazar;
tarayıcıdaki istekler `/api/proxy/*` üzerinden backend'e iletilir, access token süresi dolunca refresh token ile sessizce yenilenir.
JavaScript token'ları göremez (XSS'e karşı). `src/proxy.ts` giriş yapmamış kullanıcıyı `/login`'e yönlendirir.

## Testler ve doğrulama durumu

```bash
cd backend                     # önce: npm ci && npx prisma generate (testler/derleme üretilen Prisma Client'ı kullanır)
npm test                       # 33 birim testi (stok hareketi, transfer, auth, satın alma, sayım, roller)
npm run test:e2e               # derler + 6 uçtan uca duman testi (gerçek PostgreSQL ister)
bash scripts/smoke.sh          # çalışan API'ye curl: 70 kontrol (4 rol, onay akışları, soft/hard delete…)
npm run build && cd ../web && npm run build
```

Yazıldığı ortamda **gerçekten çalıştırılıp geçenler:** backend `build`, `npm test` (33/33), `test:e2e` (6/6), `smoke.sh` (70/70,
sunucu 3001'de), web `build`, web `lint`, tarayıcıda (headless Chrome) tüm sayfaların 4 rolle açılması + transfer onayı +
Admin kullanıcı oluştur/rol değiştir/sil/geri al/kalıcı sil akışı (3100'de), standalone web çıktısı.

**Yapılamayanlar / dikkat edilecekler:**
- **Docker:** imaj build ve `docker compose up` denenemedi (daemon yok).
- **Migration:** Prisma'nın schema-engine binary'si bu ortamda indirilemediği için `prisma migrate dev` **çalıştırılamadı**.
  `backend/prisma/migrations/20261126100000_warehouse_stock_workflows/migration.sql` Prisma'nın üretim kurallarına göre elle yazıldı,
  PostgreSQL'e uygulanıp doğrulandı. Kendi makinenizde `npm run prisma:migrate` çalıştırın: "already in sync" demeli;
  yeni migration önerirse küçük bir isimlendirme farkı vardır, çıkan dosyayı kullanabilirsiniz.
- Veri modelinde "şube" kavramı yoktur (kullanıcılar bir şubeye bağlı değildir): "Şube Yöneticisi kendi şubesi için onaylar" kuralı yerine tüm şubeler için onay yetkisi vardır.
- Hız sınırı IP başınadır; web sunucusu arkasında tüm kullanıcılar tek IP görünür. Ters vekil kullanıyorsanız `TRUST_PROXY=1` ve `X-Forwarded-For` ayarlayın.

## Proje yapısı

```
backend/
  prisma/          schema.prisma, migrations/, seed.ts
  src/
    auth/ users/ categories/ products/ warehouses/ suppliers/
    warehouse-stocks/ stock-movements/ transfer-requests/
    purchase-requests/ inventory-counts/ admin/
    shared/        PrismaModule, exception filter
  test/e2e.test.mjs  scripts/smoke.sh
web/
  src/app/         sayfalar (+ api/ route handler'ları), src/components, src/lib
docs/              ADIM_ADIM_ANLATIM.md, erd.dbml
docker-compose.yml
```

Dokümanlar: [docs/ADIM_ADIM_ANLATIM.md](docs/ADIM_ADIM_ANLATIM.md) (sade anlatım + video akışı), [docs/erd.dbml](docs/erd.dbml) (ER diyagramı, dbdiagram.io).
