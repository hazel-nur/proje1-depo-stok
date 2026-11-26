import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { DbClient } from '../shared/db.types';
import { QueryMovementsDto } from './dto/query-movements.dto';

const ILISKILER = {
  product: { select: { id: true, ad: true, sku: true } },
  sourceWarehouse: { select: { id: true, ad: true } },
  targetWarehouse: { select: { id: true, ad: true } },
  user: { select: { id: true, ad: true } },
};

export type MovementData = {
  tip: 'GIRIS' | 'CIKIS' | 'TRANSFER';
  productId: string;
  miktar: number;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  aciklama?: string;
  userId: string;
  transferRequestId?: string;
  purchaseRequestId?: string;
  inventoryCountId?: string;
};

@Injectable()
export class StockMovementsRepository {
  constructor(private prisma: PrismaService) {}

  // Birden çok yazma işlemini tek transaction'da çalıştırır (hepsi olur ya da hiçbiri)
  transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  findAll(q: QueryMovementsDto) {
    return this.prisma.stockMovement.findMany({
      where: {
        ...(q.tip ? { tip: q.tip } : {}),
        ...(q.productId ? { productId: q.productId } : {}),
        ...(q.warehouseId
          ? {
              OR: [
                { sourceWarehouseId: q.warehouseId },
                { targetWarehouseId: q.warehouseId },
              ],
            }
          : {}),
      },
      include: ILISKILER,
      orderBy: { createdAt: 'desc' },
      take: q.limit ?? 100,
    });
  }

  findById(id: string) {
    return this.prisma.stockMovement.findUnique({
      where: { id },
      include: ILISKILER,
    });
  }

  // ---- Aşağıdakiler transaction istemcisiyle (tx) çağrılır ----

  findActiveProduct(db: DbClient, id: string) {
    return db.product.findFirst({ where: { id, deletedAt: null } });
  }

  findActiveWarehouse(db: DbClient, id: string) {
    return db.warehouse.findFirst({ where: { id, deletedAt: null } });
  }

  getStock(db: DbClient, warehouseId: string, productId: string) {
    return db.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });
  }

  async increaseStock(db: DbClient, warehouseId: string, productId: string, miktar: number) {
    await db.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId, productId } },
      create: { warehouseId, productId, miktar },
      update: { miktar: { increment: miktar } },
    });
  }

  // Tek SQL ile "yeterliyse düş": yarış durumunda stok eksiye düşemez. true = düşüldü
  async decreaseStock(db: DbClient, warehouseId: string, productId: string, miktar: number) {
    const r = await db.warehouseStock.updateMany({
      where: { warehouseId, productId, miktar: { gte: miktar } },
      data: { miktar: { decrement: miktar } },
    });
    return r.count === 1;
  }

  // Product.stokMiktari = tüm depoların toplamı (delta + ya da -)
  adjustProductTotal(db: DbClient, productId: string, delta: number) {
    return db.product.update({
      where: { id: productId },
      data: { stokMiktari: { increment: delta } },
    });
  }

  createMovement(db: DbClient, data: MovementData) {
    return db.stockMovement.create({ data, include: ILISKILER });
  }
}
