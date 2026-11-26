# Depo/Stok API (backend)

NestJS 12 + Prisma 7 + PostgreSQL. Ayrıntılı kurulum, rol matrisi ve API listesi için kök [README.md](../README.md).

```bash
cp .env.example .env            # değerleri düzenleyin
npm ci
npm run prisma:generate         # Prisma Client -> src/generated/prisma
npm run prisma:deploy           # migration'ları uygular (geliştirmede: npm run prisma:migrate)
npm run seed                    # 4 rolde kullanıcı + örnek veri
npm run start:dev               # http://localhost:3000  |  Swagger: /api
```

| Komut | Ne yapar |
| --- | --- |
| `npm run build` | Derler (`dist/`) |
| `npm test` | Birim testleri (Jest) |
| `npm run test:e2e` | Derler + uçtan uca duman testi (gerçek veritabanı gerekir) |
| `npm run lint` | oxlint |
| `bash scripts/smoke.sh` | Çalışan API'ye curl ile ana akış doğrulaması (`BASE=http://localhost:3001`) |

Prisma komutları `prisma7.config.ts` üzerinden `DATABASE_URL` okur ve **backend klasöründen** çalıştırılır.
