import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

const ILISKILER = {
  warehouse: { select: { id: true, ad: true } },
  product: { select: { id: true, ad: true, sku: true, birim: true, minStokSeviyesi: true } },
};

@Injectable()
export class WarehouseStocksRepository {
  constructor(private prisma: PrismaService) {}

  findAll(filter: { warehouseId?: string; productId?: string }) {
    return this.prisma.warehouseStock.findMany({
      where: {
        ...(filter.warehouseId ? { warehouseId: filter.warehouseId } : {}),
        ...(filter.productId ? { productId: filter.productId } : {}),
        warehouse: { deletedAt: null },
        product: { deletedAt: null },
      },
      include: ILISKILER,
      orderBy: [{ warehouse: { ad: 'asc' } }, { product: { ad: 'asc' } }],
    });
  }

  // Toplam stoğu minimum seviyenin altına düşen aktif ürünler
  findLowStockProducts() {
    return this.prisma.$queryRaw<
      {
        id: string;
        ad: string;
        sku: string;
        birim: string;
        stokMiktari: number;
        minStokSeviyesi: number;
      }[]
    >`SELECT "id","ad","sku","birim","stokMiktari","minStokSeviyesi"
      FROM "Product"
      WHERE "deletedAt" IS NULL AND "stokMiktari" < "minStokSeviyesi"
      ORDER BY ("minStokSeviyesi" - "stokMiktari") DESC, "ad" ASC`;
  }

  findStocksOfProducts(productIds: string[]) {
    return this.prisma.warehouseStock.findMany({
      where: { productId: { in: productIds }, miktar: { gt: 0 }, warehouse: { deletedAt: null } },
      include: { warehouse: { select: { id: true, ad: true } } },
    });
  }
}
