/* Örnek veri: 4 rolde kullanıcı + kategori, ürün, depo, tedarikçi, stok ve örnek talepler.
 * Çalıştırma (backend klasöründen):  npm run seed
 * Tekrar çalıştırmak güvenlidir (kullanıcılar upsert, örnek veri sadece boş DB'ye eklenir). */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const KULLANICILAR = [
  { ad: 'Sistem Admini', email: 'admin@depo.com', sifre: 'Admin123!', role: 'Admin' },
  { ad: 'Şube Yöneticisi Selin', email: 'sube@depo.com', sifre: 'Sube123!', role: 'Şube Yöneticisi' },
  { ad: 'Satın Alma Mert', email: 'satinalma@depo.com', sifre: 'Satin123!', role: 'Satın Alma Sorumlusu' },
  { ad: 'Depo Personeli Deniz', email: 'depo@depo.com', sifre: 'Depo123!', role: 'Depo Personeli' },
];

async function main() {
  const kul: Record<string, string> = {};
  for (const k of KULLANICILAR) {
    const sifreHash = await bcrypt.hash(k.sifre, 10);
    const u = await prisma.user.upsert({
      where: { email: k.email },
      update: {},
      create: { ad: k.ad, email: k.email, sifreHash, role: k.role },
    });
    kul[k.role] = u.id;
  }

  if ((await prisma.warehouse.count()) > 0) {
    console.log('Örnek veri zaten var, sadece kullanıcılar kontrol edildi.');
    return;
  }

  const kategoriler = await Promise.all(
    [
      ['Elektronik', 'Bilgisayar, telefon ve aksesuarlar'],
      ['Kırtasiye', 'Ofis ve kırtasiye malzemeleri'],
      ['Temizlik', 'Temizlik ve hijyen ürünleri'],
    ].map(([ad, aciklama]) => prisma.category.create({ data: { ad, aciklama } })),
  );
  const [elek, kirt, temiz] = kategoriler;

  const urunler = await Promise.all(
    [
      { ad: 'Dizüstü Bilgisayar', sku: 'ELK-001', fiyat: 25000, minStokSeviyesi: 5, categoryId: elek.id },
      { ad: 'Kablosuz Mouse', sku: 'ELK-002', fiyat: 450, minStokSeviyesi: 20, categoryId: elek.id },
      { ad: 'A4 Fotokopi Kağıdı (koli)', sku: 'KRT-001', fiyat: 280, minStokSeviyesi: 30, categoryId: kirt.id },
      { ad: 'Tükenmez Kalem (kutu)', sku: 'KRT-002', fiyat: 90, minStokSeviyesi: 15, categoryId: kirt.id },
      { ad: 'Yüzey Temizleyici 5L', sku: 'TMZ-001', fiyat: 160, minStokSeviyesi: 10, categoryId: temiz.id },
    ].map((data) => prisma.product.create({ data })),
  );

  const [ana, sube] = await Promise.all([
    prisma.warehouse.create({ data: { ad: 'Ana Depo', sehir: 'İstanbul', adres: 'Organize Sanayi Bölgesi 3. Cad. No:5' } }),
    prisma.warehouse.create({ data: { ad: 'Ankara Şube Deposu', sehir: 'Ankara', adres: 'Siteler Mah. 12. Sok. No:8' } }),
  ]);

  const [tedarikA, tedarikB] = await Promise.all([
    prisma.supplier.create({ data: { ad: 'Anadolu Tedarik A.Ş.', email: 'satis@anadolutedarik.com', telefon: '0212 555 00 01' } }),
    prisma.supplier.create({ data: { ad: 'Marmara Ofis Ürünleri', email: 'info@marmaraofis.com', telefon: '0216 555 00 02' } }),
  ]);

  // Başlangıç stokları (hareket defteriyle tutarlı: GIRIS kaydı + depo stoğu + ürün toplamı)
  const baslangic: [number, typeof ana, number][] = [
    [0, ana, 12], [1, ana, 60], [2, ana, 100], [3, ana, 8], [4, ana, 25],
    [0, sube, 3], [2, sube, 20],
  ];
  for (const [i, depo, miktar] of baslangic) {
    const urun = urunler[i];
    await prisma.warehouseStock.create({ data: { warehouseId: depo.id, productId: urun.id, miktar } });
    await prisma.product.update({ where: { id: urun.id }, data: { stokMiktari: { increment: miktar } } });
    await prisma.stockMovement.create({
      data: {
        tip: 'GIRIS', productId: urun.id, miktar, targetWarehouseId: depo.id,
        aciklama: 'Açılış stoğu', userId: kul['Admin'],
      },
    });
  }
  // Tükenmez Kalem (kutu): toplam 8, minimum 15 -> düşük stok uyarısı örneği

  await prisma.transferRequest.create({
    data: {
      productId: urunler[2].id, miktar: 30, sourceWarehouseId: ana.id, targetWarehouseId: sube.id,
      aciklama: 'Ankara şubesinde kağıt azaldı', requestedById: kul['Depo Personeli'],
    },
  });

  await prisma.purchaseRequest.create({
    data: {
      supplierId: tedarikB.id, warehouseId: ana.id, aciklama: 'Kalem ve kağıt yenileme',
      requestedById: kul['Satın Alma Sorumlusu'],
      items: {
        create: [
          { productId: urunler[3].id, miktar: 40, birimFiyat: 85 },
          { productId: urunler[2].id, miktar: 50, birimFiyat: 270 },
        ],
      },
    },
  });
  await prisma.purchaseRequest.create({
    data: {
      supplierId: tedarikA.id, warehouseId: ana.id, aciklama: 'Mouse yenileme (onaylı, teslim bekliyor)',
      requestedById: kul['Satın Alma Sorumlusu'], durum: 'ONAYLANDI',
      decidedById: kul['Şube Yöneticisi'], decidedAt: new Date(),
      items: { create: [{ productId: urunler[1].id, miktar: 30, birimFiyat: 420 }] },
    },
  });

  console.log('Seed tamam. Giriş bilgileri:');
  for (const k of KULLANICILAR) console.log(`  ${k.role.padEnd(22)} ${k.email}  /  ${k.sifre}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
