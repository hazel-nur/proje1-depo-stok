# Depo/Stok Yönetim Sistemi

## Proje Konusu
Çok şubeli bir işletmenin depo ve stok süreçlerini yöneten backend + web sistemi.
Stok giriş/çıkış takibi, şubeler arası transfer, satın alma talepleri ve sayım (inventory count) işlemlerini kapsar.

## Roller
- **Depo Personeli:** Stok giriş/çıkış kaydı oluşturma, transfer talebi açma, sayım girişi
- **Satın Alma Sorumlusu:** Satın alma talebi oluşturma/onaylama
- **Şube Yöneticisi:** Kendi şubesi için transfer/satın alma talebi onaylama
- **Admin:** Tüm CRUD işlemleri, kullanıcı/rol yönetimi, soft-delete geri alma, hard delete

## Teknoloji Stack
- **Backend:** Nest.js (TypeScript) + Prisma ORM + PostgreSQL
- **Frontend:** Next.js
- **Auth:** JWT + bcrypt
- **Dokümantasyon:** Swagger / OpenAPI

## Mimari
Katmanlı mimari: Controller → Service → Repository → DTO
Klasör yapısı: Package by Feature

## Durum
- [x] Hafta 1: ER diyagramı ve rol-yetki tablosu tamamlandı
- [ ] Hafta 2: Backend iskeleti, Prisma kurulumu, Swagger kurulumu
- [ ] Hafta 3-4: Auth ve RBAC
- [ ] Hafta 5-10: İş modülleri
- [ ] Hafta 11-17: Frontend ve Admin Paneli
- [ ] Hafta 18-20: Test ve son düzeltmeler
