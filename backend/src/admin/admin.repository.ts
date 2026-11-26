import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(private prisma: PrismaService) {}

  async collect() {
    const p = this.prisma;
    const yediGunOnce = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const aktif = { deletedAt: null };
    const silinmis = { deletedAt: { not: null } };

    const [
      kullanici, kullaniciSilinmis, roller,
      urun, urunSilinmis, kategori, kategoriSilinmis,
      depo, depoSilinmis, tedarikci, tedarikciSilinmis,
      transferSilinmis, satinAlmaSilinmis, sayimSilinmis,
      bekleyenTransfer, bekleyenSatinAlma, onayliSatinAlma, acikSayim,
      hareketToplam, hareketler7gun,
      stokToplam, stokDegeri, dusukStok, sonHareketler,
    ] = await Promise.all([
      p.user.count({ where: aktif }),
      p.user.count({ where: silinmis }),
      p.user.groupBy({ by: ['role'], where: aktif, _count: { _all: true } }),
      p.product.count({ where: aktif }),
      p.product.count({ where: silinmis }),
      p.category.count({ where: aktif }),
      p.category.count({ where: silinmis }),
      p.warehouse.count({ where: aktif }),
      p.warehouse.count({ where: silinmis }),
      p.supplier.count({ where: aktif }),
      p.supplier.count({ where: silinmis }),
      p.transferRequest.count({ where: silinmis }),
      p.purchaseRequest.count({ where: silinmis }),
      p.inventoryCount.count({ where: silinmis }),
      p.transferRequest.count({ where: { ...aktif, durum: 'BEKLIYOR' } }),
      p.purchaseRequest.count({ where: { ...aktif, durum: 'BEKLIYOR' } }),
      p.purchaseRequest.count({ where: { ...aktif, durum: 'ONAYLANDI' } }),
      p.inventoryCount.count({ where: { ...aktif, durum: 'ACIK' } }),
      p.stockMovement.count(),
      p.stockMovement.groupBy({
        by: ['tip'],
        where: { createdAt: { gte: yediGunOnce } },
        _count: { _all: true },
        _sum: { miktar: true },
      }),
      p.product.aggregate({ where: aktif, _sum: { stokMiktari: true } }),
      p.$queryRaw<{ deger: number | null }[]>`SELECT COALESCE(SUM("stokMiktari" * "fiyat"), 0)::float8 AS deger FROM "Product" WHERE "deletedAt" IS NULL`,
      p.$queryRaw<{ adet: bigint }[]>`SELECT COUNT(*) AS adet FROM "Product" WHERE "deletedAt" IS NULL AND "stokMiktari" < "minStokSeviyesi"`,
      p.stockMovement.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { ad: true } },
          sourceWarehouse: { select: { ad: true } },
          targetWarehouse: { select: { ad: true } },
          user: { select: { ad: true } },
        },
      }),
    ]);

    return {
      kullanici, kullaniciSilinmis, roller,
      urun, urunSilinmis, kategori, kategoriSilinmis,
      depo, depoSilinmis, tedarikci, tedarikciSilinmis,
      transferSilinmis, satinAlmaSilinmis, sayimSilinmis,
      bekleyenTransfer, bekleyenSatinAlma, onayliSatinAlma, acikSayim,
      hareketToplam, hareketler7gun,
      toplamStokAdedi: stokToplam._sum.stokMiktari ?? 0,
      toplamStokDegeri: stokDegeri[0]?.deger ?? 0,
      dusukStokUrunSayisi: Number(dusukStok[0]?.adet ?? 0),
      sonHareketler,
    };
  }
}
