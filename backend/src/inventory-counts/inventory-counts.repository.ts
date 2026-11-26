import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { DbClient } from '../shared/db.types';

const ILISKILER = {
  warehouse: { select: { id: true, ad: true } },
  createdBy: { select: { id: true, ad: true } },
  appliedBy: { select: { id: true, ad: true } },
  items: {
    include: { product: { select: { id: true, ad: true, sku: true, birim: true } } },
    orderBy: { product: { ad: 'asc' as const } },
  },
};

export type KalemVeri = {
  productId: string;
  beklenenMiktar: number;
  sayilanMiktar: number;
  fark: number;
};

@Injectable()
export class InventoryCountsRepository {
  constructor(private prisma: PrismaService) {}

  transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  create(data: {
    warehouseId: string;
    aciklama?: string;
    createdById: string;
    items: KalemVeri[];
  }) {
    const { items, ...rest } = data;
    return this.prisma.inventoryCount.create({
      data: { ...rest, items: { create: items } },
      include: ILISKILER,
    });
  }

  // Kalemleri ve açıklamayı yeniler (tek transaction)
  update(id: string, aciklama: string | undefined, items?: KalemVeri[]) {
    return this.prisma.$transaction(async (tx) => {
      if (items) {
        await tx.inventoryCountItem.deleteMany({ where: { inventoryCountId: id } });
        await tx.inventoryCountItem.createMany({
          data: items.map((i) => ({ ...i, inventoryCountId: id })),
        });
      }
      return tx.inventoryCount.update({
        where: { id },
        data: aciklama !== undefined ? { aciklama } : {},
        include: ILISKILER,
      });
    });
  }

  findAllActive() {
    return this.prisma.inventoryCount.findMany({
      where: { deletedAt: null },
      include: ILISKILER,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllDeleted() {
    return this.prisma.inventoryCount.findMany({
      where: { deletedAt: { not: null } },
      include: ILISKILER,
      orderBy: { deletedAt: 'desc' },
    });
  }

  findActiveById(id: string, db: DbClient = this.prisma) {
    return db.inventoryCount.findFirst({
      where: { id, deletedAt: null },
      include: ILISKILER,
    });
  }

  findById(id: string) {
    return this.prisma.inventoryCount.findUnique({ where: { id } });
  }

  findActiveWarehouse(id: string) {
    return this.prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
  }

  countActiveProducts(ids: string[]) {
    return this.prisma.product.count({ where: { id: { in: ids }, deletedAt: null } });
  }

  // Depodaki mevcut miktarlar: { productId: miktar }
  async stockMap(warehouseId: string, productIds: string[], db: DbClient = this.prisma) {
    const rows = await db.warehouseStock.findMany({
      where: { warehouseId, productId: { in: productIds } },
    });
    return new Map(rows.map((r) => [r.productId, r.miktar]));
  }

  // ACIK -> UYGULANDI geçişi (yarış durumuna karşı güvenli). true = başarılı
  async markApplied(db: DbClient, id: string, userId: string) {
    const r = await db.inventoryCount.updateMany({
      where: { id, durum: 'ACIK', deletedAt: null },
      data: { durum: 'UYGULANDI', appliedById: userId, appliedAt: new Date() },
    });
    return r.count === 1;
  }

  updateItem(db: DbClient, itemId: string, beklenenMiktar: number, fark: number) {
    return db.inventoryCountItem.update({
      where: { id: itemId },
      data: { beklenenMiktar, fark },
    });
  }

  markDeleted(id: string) {
    return this.prisma.inventoryCount.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: ILISKILER,
    });
  }

  restore(id: string) {
    return this.prisma.inventoryCount.update({
      where: { id },
      data: { deletedAt: null },
      include: ILISKILER,
    });
  }

  delete(id: string) {
    return this.prisma.inventoryCount.delete({ where: { id } });
  }
}
