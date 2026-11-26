// Uçtan uca duman testi: gerçek Nest uygulaması (derlenmiş dist/) + gerçek PostgreSQL.
// Çalıştırma: npm run test:e2e   (önce build alır; .env içinde DATABASE_URL ve JWT_* tanımlı,
// migration'lar uygulanmış olmalı). Node'un yerleşik test koşucusu kullanılır, böylece
// Nest 12'nin saf ESM paketleri Node 22 ve 24'te sorunsuz yüklenir.
import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import request from 'supertest';
import bcrypt from 'bcrypt';

const require = createRequire(import.meta.url);
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { setupApp } = require('../dist/setup-app');
const { PrismaService } = require('../dist/shared/prisma.service');

const s = Date.now();
const adminEmail = `e2e-admin-${s}@test.com`;
const depoEmail = `e2e-depo-${s}@test.com`;
let app, prisma, http, adminToken, depoToken;
const temizlik = [];
const auth = (t) => ({ Authorization: `Bearer ${t}` });

before(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  setupApp(app);
  await app.init();
  prisma = app.get(PrismaService);
  http = () => request(app.getHttpServer());

  await prisma.user.create({
    data: { ad: 'E2E Admin', email: adminEmail, sifreHash: await bcrypt.hash('Admin123!', 4), role: 'Admin' },
  });
  const res = await http().post('/auth/login').send({ email: adminEmail, sifre: 'Admin123!' }).expect(200);
  adminToken = res.body.access_token;
});

after(async () => {
  for (const fn of temizlik.reverse()) await fn().catch(() => undefined);
  await prisma.user.deleteMany({ where: { email: { in: [adminEmail, depoEmail] } } });
  await app.close();
});

test('GET / ve /health ayakta', async () => {
  await http().get('/').expect(200).expect('Hello World!');
  await http().get('/health').expect(200, { status: 'ok' });
});

test('token yoksa 401, hata gövdesi { error, code }', async () => {
  const r = await http().get('/products').expect(401);
  assert.equal(typeof r.body.error, 'string');
  assert.equal(r.body.code, 'UNAUTHORIZED');
});

test('doğrulama: hatalı gövde 400 VALIDATION_ERROR', async () => {
  const r = await http().post('/categories').set(auth(adminToken)).send({ ad: '' }).expect(400);
  assert.equal(r.body.code, 'VALIDATION_ERROR');
});

test('register rolü Depo Personeli yapar; Depo Personeli /users ve /admin/stats göremez', async () => {
  const r = await http()
    .post('/auth/register')
    .send({ ad: 'E2E Depo', email: depoEmail, sifre: '123456', role: 'Admin' })
    .expect(201);
  assert.equal(r.body.role, 'Depo Personeli');
  assert.equal(r.body.sifreHash, undefined);
  const l = await http().post('/auth/login').send({ email: depoEmail, sifre: '123456' }).expect(200);
  depoToken = l.body.access_token;
  await http().get('/users').set(auth(depoToken)).expect(403);
  await http().get('/admin/stats').set(auth(depoToken)).expect(403);
  await http().get('/products').set(auth(depoToken)).expect(200);
});

test('refresh token rotation', async () => {
  const l = await http().post('/auth/login').send({ email: adminEmail, sifre: 'Admin123!' }).expect(200);
  const r2 = await http().post('/auth/refresh').send({ refresh_token: l.body.refresh_token }).expect(200);
  assert.ok(r2.body.access_token);
  await http().post('/auth/refresh').send({ refresh_token: l.body.refresh_token }).expect(401);
  // reuse sonrası oturum kapandığı için bir sonraki testler için yeniden giriş
  const again = await http().post('/auth/login').send({ email: adminEmail, sifre: 'Admin123!' }).expect(200);
  adminToken = again.body.access_token;
});

test('ana akış: depo + ürün + giriş/çıkış/transfer + stats + soft/hard delete', async () => {
  const cat = await http().post('/categories').set(auth(adminToken)).send({ ad: `E2E Kat ${s}` }).expect(201);
  temizlik.push(() => prisma.category.deleteMany({ where: { id: cat.body.id } }));
  const prod = await http().post('/products').set(auth(adminToken))
    .send({ ad: 'E2E Ürün', sku: `E2E-${s}`, fiyat: 10, minStokSeviyesi: 5, categoryId: cat.body.id }).expect(201);
  temizlik.push(() => prisma.product.deleteMany({ where: { id: prod.body.id } }));
  const wa = await http().post('/warehouses').set(auth(adminToken)).send({ ad: `E2E A ${s}` }).expect(201);
  const wb = await http().post('/warehouses').set(auth(adminToken)).send({ ad: `E2E B ${s}` }).expect(201);
  temizlik.push(() => prisma.warehouse.deleteMany({ where: { id: { in: [wa.body.id, wb.body.id] } } }));

  const pid = prod.body.id;
  await http().post('/stock-movements/entry').set(auth(depoToken)).send({ productId: pid, warehouseId: wa.body.id, miktar: 20 }).expect(201);
  await http().post('/stock-movements/exit').set(auth(depoToken)).send({ productId: pid, warehouseId: wa.body.id, miktar: 100 }).expect(409);
  const tr = { productId: pid, sourceWarehouseId: wa.body.id, targetWarehouseId: wb.body.id, miktar: 5 };
  await http().post('/stock-movements/transfer').set(auth(depoToken)).send(tr).expect(403);
  await http().post('/stock-movements/transfer').set(auth(adminToken)).send(tr).expect(201);

  const stoklar = await http().get(`/warehouse-stocks?productId=${pid}`).set(auth(depoToken)).expect(200);
  const miktar = (id) => stoklar.body.find((x) => x.warehouseId === id).miktar;
  assert.equal(miktar(wa.body.id), 15);
  assert.equal(miktar(wb.body.id), 5);
  const p = await http().get(`/products/${pid}`).set(auth(depoToken)).expect(200);
  assert.equal(p.body.stokMiktari, 20);

  const stats = await http().get('/admin/stats').set(auth(adminToken)).expect(200);
  assert.ok(stats.body.stok.toplamAdet >= 20);

  await http().delete(`/products/${pid}`).set(auth(adminToken)).expect(200);
  await http().get(`/products/${pid}`).set(auth(adminToken)).expect(404);
  const silinen = await http().get('/products/deleted').set(auth(adminToken)).expect(200);
  assert.ok(silinen.body.some((x) => x.id === pid));
  await http().patch(`/products/${pid}/restore`).set(auth(adminToken)).expect(200);
  await http().delete(`/products/${pid}/hard`).set(auth(depoToken)).expect(403);
});
