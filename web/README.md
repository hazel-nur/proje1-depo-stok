# Depo/Stok web arayüzü

Next.js 16 (App Router) + Tailwind + React Query + axios. Kurulum ve genel bilgi için kök [README.md](../README.md).

```bash
cp .env.example .env.local     # BACKEND_URL=http://localhost:3000 (backend portu)
npm ci
npm run dev                    # http://localhost:3100
npm run build && npm start     # üretim derlemesi, yine 3100
```

- Oturum token'ları **httpOnly cookie**'de tutulur; tarayıcı backend'e `/api/proxy/*` üzerinden gider (`src/lib/server/session.ts`).
- `src/proxy.ts` giriş yapmamış kullanıcıyı `/login`'e yönlendirir (Next.js 16'da `middleware` yerine `proxy`).
