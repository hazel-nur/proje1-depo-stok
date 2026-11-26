# Backend (NestJS 12 + Prisma 7). Not: bu dosya Docker daemon olmayan ortamda yazıldı,
# imaj build edilip denenemedi (bkz. kök README, "Doğrulama durumu").
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
# Prisma Client üretilir (src/generated/prisma), sonra TypeScript derlenir
RUN npx prisma generate --config prisma7.config.ts && npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# node_modules geliştirme bağımlılıklarıyla birlikte taşınır: `npm run seed` (tsx) konteyner içinde çalışabilsin
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY package*.json prisma7.config.ts ./
COPY prisma ./prisma
EXPOSE 3000
# Açılışta bekleyen migration'lar uygulanır, sonra API başlar
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma7.config.ts && node dist/main"]
