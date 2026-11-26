# Adım Adım Anlatım

Bu belge projeyi **hiç kod okumadan** anlatmak için yazıldı. Her adımda iki şey var:
**NE yaptık?** ve **NEDEN yaptık?**

---

## 0. Proje ne işe yarıyor?

Düşün ki bir işletmenin birkaç şubesi ve her şubede bir deposu var. Depolarda ürünler duruyor.
Bu program şunları takip eder:

- Hangi depoda hangi üründen **kaç tane** var?
- Depoya mal **girdi** mi, **çıktı** mı?
- Bir depodan diğerine mal **gönderildi** mi? (transfer)
- Eksik ürün için **satın alma** talebi açıldı mı, geldi mi?
- Rafı **saydık** mı, kayıttaki sayıyla uyuyor mu? (sayım)
- Ürün azaldıysa **uyarı** var mı?

Programı kullanan insanların **rolleri** var. Herkes her şeyi yapamaz:

| Rol | Kısaca ne yapar? |
| --- | --- |
| Depo Personeli | Mal girişi/çıkışı yapar, transfer talebi açar, sayım yapar, gelen malı teslim alır |
| Satın Alma Sorumlusu | Satın alma talebi hazırlar, tedarikçileri yönetir |
| Şube Yöneticisi | Transfer ve satın alma taleplerini onaylar/reddeder, sayımı uygular |
| Admin | Her şeyi yapar; kullanıcıları yönetir; silinenleri geri getirir veya tamamen siler |

---

## Terim sözlüğü

| Terim | Çok basit anlamı |
| --- | --- |
| **Backend** | Ekranda görünmeyen, işi yapan ve veriyi saklayan kısım ("mutfak") |
| **Frontend / Client** | Ekranda gördüğümüz kısım ("salon") |
| **API** | Frontend'in backend'e soru sorduğu/iş istediği kapı. Garsonun mutfağa söylediği sipariş gibi |
| **Endpoint (uç)** | API'deki tek bir kapı, örn. "ürünleri listele" |
| **Veritabanı (DB)** | Verilerin kalıcı durduğu defter. Biz PostgreSQL kullandık |
| **Tablo** | Defterdeki bir liste (Ürünler tablosu gibi) |
| **Prisma** | Kodumuzun veritabanıyla konuşmasını kolaylaştıran araç (çevirmen) |
| **Migration** | Veritabanı yapısının sürüm sürüm kaydı. "Şu tabloyu ekle" talimatları |
| **Seed** | Veritabanına başlangıç/örnek veri koyan program |
| **NestJS** | Backend'i düzenli yazmamızı sağlayan çatı |
| **Next.js** | Frontend'i yazdığımız çatı |
| **JWT (token)** | Giriş yapınca verilen dijital kimlik kartı. Her istekte gösterilir |
| **Access token** | Kısa ömürlü kimlik kartı (15 dakika) |
| **Refresh token** | Uzun ömürlü (7 gün) yedek kart; sadece yeni access token almak için kullanılır |
| **Rotation** | Her yenilemede yeni kart verilir, eskisi çöpe gider; çalınan eski kart işe yaramaz |
| **Hash** | Bir yazının geri çevrilemeyen "parmak izi". Şifreleri düz yazı saklamayız, hash'ini saklarız |
| **bcrypt** | Şifreleri hash'lemek için kullandığımız yöntem |
| **Rol / RBAC** | Kullanıcının rolüne göre yetki verme |
| **Guard** | Kapıdaki görevli: "Kartın var mı? Rolün uygun mu?" diye bakar |
| **DTO** | Gelen verinin nasıl görünmesi gerektiğini tarif eden şablon (örn. "ad boş olamaz") |
| **Validation** | Gelen verinin şablona uyup uymadığını kontrol etmek |
| **Controller → Service → Repository** | Üç katman: Controller isteği karşılar, Service kuralları uygular, Repository veritabanıyla konuşur |
| **Package by Feature** | Kodu özelliğe göre klasörlemek (ürünle ilgili her şey `products/` içinde) |
| **Soft delete** | "Silinmiş gibi göster" ama veriyi gerçekten silme. `deletedAt` alanına tarih yazılır |
| **Restore** | Soft delete ile silineni geri getirmek |
| **Hard delete** | Veriyi veritabanından tamamen silmek. Geri dönüş yok |
| **Transaction** | "Ya hep ya hiç" kuralı. Bir iş birden çok adımdan oluşuyorsa, biri bozulursa hepsi geri alınır |
| **Rate limit (throttle)** | Bir kişinin kısa sürede çok fazla istek atmasını engellemek |
| **CORS** | Tarayıcının "bu siteden şu API'ye istek atılabilir mi?" kuralı |
| **Swagger** | API'nin otomatik oluşan, tarayıcıda denenebilen kullanım kılavuzu |
| **httpOnly cookie** | JavaScript'in okuyamadığı özel çerez. Token'ı buraya koyarız, böylece kötü kod çalamaz |
| **React Query** | Frontend'de veriyi sunucudan getirip önbellekte tutan kütüphane |
| **Docker** | Programı "paketleyip" her bilgisayarda aynı şekilde çalıştıran araç |
| **ERD** | Tablolar ve aralarındaki ilişkilerin resmi |

---

## Hocanın 7 başlığı ile eşleme

| # | Başlık | Bu projede karşılığı | Nerede? |
| --- | --- | --- | --- |
| 1 | **Discovery** (keşif) | Sorunun anlaşılması: çok şubeli işletmede stok karışıyor. Kullanıcılar ve rolleri belirlendi | Bölüm 1 |
| 2 | **PRD** (ürün gereksinimleri) | Hangi özellik, kim için, hangi kurallarla: rol matrisi ve iş kuralları | Bölüm 2, `README.md` |
| 3 | **DB / Mimari** | Tablolar, ilişkiler (ERD), katmanlı mimari, Prisma, migration | Bölüm 3, `docs/erd.dbml` |
| 4 | **Backend** | NestJS API: auth, roller, tüm modüller, transaction, testler, Swagger | Bölüm 4 |
| 5 | **Client** | Next.js arayüzü: giriş, menü, sayfalar, Admin paneli | Bölüm 5 |
| 6 | **Integration** (entegrasyon) | Frontend ile backend'in güvenle konuşması: cookie oturumu, proxy, token yenileme | Bölüm 6 |
| 7 | **Deploy** (yayına alma) | Docker, docker-compose, ortam değişkenleri | Bölüm 7 |

---

## 1. Discovery — Sorunu anlamak

**NE yaptık?** Önce "bu program kimin için, hangi derdi çözecek?" sorusuna cevap aradık.
Sonuç: Şubeler arası stok kaybolmasın, kim ne zaman ne yaptı bilinsin, eksik stok erken fark edilsin.
Dört kullanıcı tipi (rol) çıkardık (yukarıdaki tablo).

**NEDEN?** Ne yapacağını bilmeden kod yazılmaz. Roller en baştan netleşmezse "kim neyi görebilir?"
sorusu sonradan her yeri karıştırır.

---

## 2. PRD — Ne yapılacak, kuralları ne?

**NE yaptık?** Özellikleri ve kuralları yazılı hale getirdik:

1. Ürün, kategori, depo, tedarikçi kayıtları tutulur.
2. Stok **depo başına** tutulur. Ürünün "toplam stoğu" tüm depoların toplamıdır.
3. Stok **sadece hareketle** değişir (giriş, çıkış, transfer). Rakamı elle değiştirmek yok. (Neden? Kim değiştirdi, ne zaman, neden — hepsi kayıtlı kalsın.)
4. Transfer **onaylıdır**: Depo personeli ister, yönetici onaylar, o zaman stok taşınır.
5. Satın alma: talep → onay → teslim alma. Teslim alınınca stok kendiliğinden artar.
6. Sayım: Gerçekte sayılan ile kayıttaki fark hesaplanır (**fark = gerçek − beklenen**). Yönetici "uygula" derse stok düzelir.
7. Silme **önce soft delete**'tir. Sadece Admin geri getirebilir veya tamamen silebilir.
8. Her rolün yapabildikleri ayrıdır (README'deki rol matrisi).

**NEDEN?** Bu kurallar "doğru" davranışı tarif eder; testlerimiz bu kuralların çalıştığını kontrol eder.

---

## 3. DB / Mimari — Veriyi ve kodu düzenlemek

### 3.1 Veritabanı tabloları (kısaca)

- **User** — kullanıcılar (şifre hash'li, rol, `refreshTokenHash`)
- **Category, Product** — kategoriler ve ürünler
- **Warehouse** — depolar
- **Supplier** — tedarikçiler
- **WarehouseStock** — "şu depoda şu üründen kaç tane var"
- **StockMovement** — giriş/çıkış/transfer defteri (silinmez)
- **TransferRequest** — transfer talepleri ve durumları
- **PurchaseRequest + PurchaseRequestItem** — satın alma talebi ve kalemleri
- **InventoryCount + InventoryCountItem** — sayım ve sayılan ürünler

Resmi: `docs/erd.dbml` dosyasını <https://dbdiagram.io/d> sitesine yapıştırınca çizim çıkar.

**NEDEN böyle?**
- Stok ayrı tabloda (WarehouseStock) çünkü aynı ürün birden çok depoda olabilir.
- Hareket defteri silinmez çünkü "geçmişi kaybetmemek" denetim için şart.
- Sık aranan alanlara **index** koyduk (örn. durum, ürün, depo, tarih). Index, kitabın arkasındaki "dizin" gibidir: aramayı hızlandırır.
- Her tabloda `deletedAt` var (soft delete) — hareket defteri hariç.

### 3.2 Migration

**NE yaptık?** Tabloları elle değil, **migration** dosyalarıyla kurduk (`backend/prisma/migrations`).
**NEDEN?** Böylece veritabanı yapısı da sürüm sürüm kayıtlı olur; başka bilgisayarda aynı komutla aynı tablolar oluşur.

### 3.3 Katmanlı mimari

Her özellikte aynı üç katman var:

1. **Controller** — isteği alır, "bu kişinin rolü uygun mu?" diye Guard'a sorar.
2. **Service** — iş kurallarını uygular ("stok yetersiz mi?", "talep zaten onaylanmış mı?").
3. **Repository** — veritabanıyla konuşan tek yer.

**NEDEN?** Herkesin işi belli olur. Veritabanını değiştirsek sadece Repository değişir. Test yazması kolaylaşır.

---

## 4. Backend — Mutfak

### 4.1 Kurulum (`backend/`)

1. `.env` dosyası: veritabanı adresi ve gizli anahtarlar. **Repoya konmaz** (şifre sızmasın). Örneği `.env.example`.
2. `npm ci` — kütüphaneleri kurar.
3. `npm run prisma:generate` — Prisma'nın kodumuz için "çevirmen" dosyalarını üretir.
4. `npm run prisma:deploy` — tabloları oluşturur.
5. `npm run seed` — 4 rolden birer kullanıcı ve örnek veri ekler.
6. `npm run start:dev` — sunucuyu başlatır. Port: `PORT` değişkeni, yoksa 3000.

### 4.2 Giriş ve güvenlik

- **Giriş (login):** e-posta + şifre doğruysa iki token verilir: access (15 dk) ve refresh (7 gün).
  *Neden iki tane?* Access çalınsa bile 15 dakikada ölür. Refresh nadiren gönderilir.
- **Refresh + rotation:** Süre dolunca refresh ile yenisi alınır; eskisi geçersiz olur. Eski bir token tekrar gelirse oturum tamamen kapatılır.
- **Çıkış (logout):** refresh token veritabanından silinir; artık yenileme yapılamaz.
- **Şifre:** bcrypt ile hash'lenir. Veritabanı çalınsa bile düz şifre yok.
- **Roller:** Her uçta `@Roles(...)` ile "kim girebilir" yazar. Yetkisiz kişi `403`, kimliksiz kişi `401` alır.
- **Kayıt (register):** Herkese açık kayıt her zaman en düşük yetkili rol olan "Depo Personeli" yaratır. *Neden?* Yoksa herkes kendini Admin yapabilirdi. Yetkili hesapları sadece Admin açar.
- **Rate limit:** Dakikada çok fazla istek atan engellenir (giriş denemelerinde daha sıkı). *Neden?* Şifre deneme saldırılarına karşı.
- **Doğrulama:** Yanlış/eksik veri `400` ile reddedilir; şablonda olmayan alanlar atılır. *Neden?* Biri `role: "Admin"` gibi zararlı alan göndermesin.
- **Hata biçimi:** Her hata aynı şekildedir: `{ "error": "mesaj", "code": "KOD" }`. *Neden?* Frontend her hatayı aynı şekilde gösterebilir.
- **CORS:** Sadece bizim web adresimiz API'ye tarayıcıdan istek atabilir.

### 4.3 Modüller

Her biri kendi klasöründe (Package by Feature):

- **products, categories, warehouses, suppliers** — kayıt ekle/listele/güncelle/sil (soft)/geri al/tamamen sil.
- **warehouse-stocks** — depo başına stok; **düşük stok** listesi.
- **stock-movements** — giriş, çıkış, doğrudan transfer.
- **transfer-requests** — transfer talebi ve onay akışı.
- **purchase-requests** — satın alma talebi, onay, teslim alma.
- **inventory-counts** — sayım ve uygulama.
- **users** (Admin) — kullanıcı oluştur, rol değiştir, sil.
- **admin** — `GET /admin/stats` istatistikleri.

### 4.4 Transaction — "ya hep ya hiç"

Örnek: Transfer onaylanınca şunlar olur: (1) talep "onaylandı" olur, (2) kaynak depodan düşer, (3) hedef depoya eklenir, (4) hareket defterine yazılır.
Bunlar **tek transaction**'dadır. Mesela kaynakta yeterli mal yoksa 2. adım hata verir ve **1. adım da geri alınır**; yani talep "onaylandı" görünüp stok taşınmamış gibi bir tutarsızlık olmaz.
Aynı mantık satın alma teslimi ve sayım uygulamada da var.

### 4.5 Soft delete / restore / hard delete

- `DELETE /products/5` → kayıt silinmez, `deletedAt`'e tarih yazılır. Listelerde görünmez.
- `GET /products/deleted` → (Admin) silinenleri gösterir.
- `PATCH /products/5/restore` → (Admin) geri getirir.
- `DELETE /products/5/hard` → (Admin) veritabanından tamamen siler.

*Neden?* Yanlışlıkla silme olur. Soft delete bir "çöp kutusu"dur; hard delete çöp kutusunu boşaltmaktır, bunu sadece Admin yapabilir.
Güvenlik kuralları da var: içinde stok olan depo silinemez, son Admin silinemez, kendini silemezsin.

### 4.6 Swagger

Backend çalışırken `http://localhost:3000/api` adresi tüm uçları listeler. Sağ üstteki **Authorize** düğmesine access token yapıştırınca uçları tarayıcıdan deneyebilirsin.
*Neden?* Dokümantasyon kodla birlikte kendiliğinden güncel kalır.

### 4.7 Testler

- **Birim testleri (`npm test`):** Stok hareketi, transfer, satın alma, sayım, auth ve rol kontrolü; veritabanı olmadan, sahte (mock) parçalarla.
- **e2e duman testi (`npm run test:e2e`):** Gerçek uygulama + gerçek veritabanı; ana akış çalışıyor mu?
- **smoke.sh:** Çalışan sunucuya curl ile 70 kontrol: roller, onay akışları, soft/hard delete.

*Neden?* Bir şeyi değiştirince başka bir şeyin bozulmadığını anında görmek için.

---

## 5. Client — Salon (`web/`)

- **Giriş sayfası:** e-posta + şifre. Altta örnek hesaplar (tıklayınca kutular dolar).
- **Rol bazlı menü:** Kullanıcı sadece yetkisi olan sayfaları görür. (Ama asıl güvenlik backend'dedir; menüyü gizlemek sadece kolaylıktır.)
- **Panel:** Özet kartlar (ürün, depo, düşük stok, bekleyen işler), son hareketler.
- **Sayfalar:** Ürünler, Kategoriler, Depolar, Tedarikçiler, Stok Durumu (+düşük stok), Stok Hareketleri, Transferler, Satın Alma, Sayımlar.
- **Admin paneli:** Kullanıcılar (oluştur, rol değiştir, sil), Silinenler (geri al / kalıcı sil), İstatistikler.
- **Mobil uyum:** Telefonda menü ☰ düğmesine dönüşür, tablolar yana kaydırılır.
- **React Query:** Sunucudan gelen listeleri önbellekte tutar, bir işlem yapınca ilgili listeyi kendisi yeniler.

---

## 6. Integration — Frontend ile backend'i güvenle bağlamak

**Sorun:** Token'ı tarayıcının hafızasında tutarsak kötü bir script çalabilir.
**Çözüm:** Token'ı **httpOnly cookie**'de tutuyoruz; JavaScript okuyamaz.

Akış:

1. Kullanıcı giriş formunu doldurur → `web`'in kendi sunucusundaki `/api/auth/login` çalışır.
2. O, backend'in `/auth/login` ucuna gider, token'ları alır ve **cookie'ye yazar**. Tarayıcıya sadece kullanıcı bilgisi döner.
3. Sonraki tüm istekler `/api/proxy/...` üzerinden gider. Web sunucusu cookie'deki token'ı alır, backend'e `Authorization` başlığıyla iletir.
4. Access token süresi dolduysa web sunucusu **refresh token ile otomatik yeniler**; kullanıcı fark etmez. Aynı anda gelen birden çok istek tek bir yenileme yapar (yoksa rotation yüzünden oturum kapanırdı).
5. Çıkış yapınca cookie'ler silinir ve backend'de refresh token geçersiz kılınır.

*Neden proxy?* Tarayıcı backend adresini ve token'ı hiç görmez; CORS derdi azalır.

---

## 7. Deploy — Yayına alma

- **`backend/Dockerfile`** ve **`web/Dockerfile`:** Programları "paket" (imaj) haline getirir.
- **`docker-compose.yml`:** Üçünü (veritabanı + backend + web) tek komutla ayağa kaldırır: `docker compose up --build`.
- Backend açılırken tabloları kendisi kurar (`prisma migrate deploy`).
- Gizli bilgiler `.env` / ortam değişkenlerinden gelir; repoda yok.

**Dürüst durum:** Bu dosyalar yazıldı ama **Docker'ı olmayan bir ortamda**; yani imajlar derlenip çalıştırılamadı.
Kendi bilgisayarında `docker compose up --build` ile denemen gerekir.

---

# Video akışı (kod okumadan, ~8-10 dakika)

Amaç: Projeyi ekran üzerinden anlatmak. Hazırlık: backend ve web çalışıyor, `npm run seed` yapılmış.

### 1) Yapı (1 dk)
- Klasörlere göster: `backend/` (mutfak), `web/` (salon), `docs/`, `docker-compose.yml`.
- Söyle: "Backend NestJS, veritabanı PostgreSQL, ekran Next.js. Kod özelliğe göre klasörlenmiş: ürünler, depolar, transferler… hepsi kendi klasöründe."
- `docs/erd.dbml` içeriğini dbdiagram.io'da aç, tabloları ve ilişkileri göster.

### 2) Swagger (2 dk)
- Tarayıcıda `http://localhost:3000/api` (test için 3001).
- "Bütün API'ler burada otomatik listeleniyor, gruplara ayrılmış."
- `POST /auth/login` ile `admin@depo.com / Admin123!` gir → dönen `access_token`'ı kopyala → sağ üst **Authorize**'a yapıştır.
- `GET /products` dene → liste gelir. Çıkıp bu kez token'sız dene → `401`.
- `GET /warehouse-stocks/low` dene → düşük stoklu ürünler.
- Hata biçimini göster: `{ error, code }`.

### 3) Admin Paneli (2 dk)
- `http://localhost:3100` → Admin ile giriş.
- Panel kartları: ürün, depo, stok değeri, düşük stok, bekleyen işler.
- **Admin Paneli → İstatistikler**: rol dağılımı, son 7 gün hareketleri.
- **Kullanıcılar**: yeni kullanıcı oluştur ("Depo Personeli"), listeden **rolünü değiştir**.

### 4) Roller (2 dk)
- Çıkış yap. `depo@depo.com / Depo123!` ile gir: menüde **Admin Paneli yok**, Tedarikçiler yok.
- **Stok Hareketleri → + Giriş**: bir ürüne giriş yap, stok artar. Çıkışta fazla miktar yaz → "Yetersiz stok" hatası.
- **Transferler → + Transfer talebi** aç (durum: Bekliyor). Depo Personeli'nde "Onayla" düğmesi **yok**.
- Çıkış yap, `sube@depo.com / Sube123!` ile gir: **Transferler**'de talebi **Onayla** → **Stok Durumu**'nda stokun taştığını göster.
- `satinalma@depo.com / Satin123!`: **Satın Alma → + Yeni talep** oluştur; onaylama düğmesi yok. Şube Yöneticisi onaylar, Depo Personeli **Teslim al** der, stok kendiliğinden artar.
- İstersen **Sayımlar**: sayım oluştur, farkı göster (gerçek − beklenen), Şube Yöneticisi "Uygula" der.

### 5) Soft / Hard delete (2 dk)
- Admin (veya Şube Yöneticisi) ile **Kategoriler** ya da **Ürünler**'de bir kaydı **Sil**: listeden kaybolur ("soft delete: veri silinmedi, işaretlendi").
- Admin ile **Admin Paneli → Silinenler**: kayıt orada. **Geri al** → listeye döner.
- Tekrar sil, **Kalıcı sil** → "bu geri alınamaz" uyarısı → kayıt tamamen gider (hard delete).
- Şube Yöneticisi'nin "Silinenler" sayfasını göremediğini ve Swagger'da `GET /products/deleted`'in `403` verdiğini göster.

### Kapanış cümlesi
"Rol kontrolü hem ekranda hem asıl olarak backend'de var; stok sadece hareketle değişiyor ve işlemler transaction içinde yapıldığı için tutarsızlık oluşmuyor."
