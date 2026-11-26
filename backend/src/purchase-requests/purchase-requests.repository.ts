import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { DbClient } from '../shared/db.types';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';

const ILISKILER = {
  supplier: { select: { id: true, ad: true } },
  warehouse: { select: { id: true, ad: true } },
  requestedBy: { select: { id: true, ad: true } },
  decidedBy: { select: { id: true, ad: true } },
  receivedBy: { select: { id: true, ad: true } },
  items: { include: { product: { select: { id: true, ad: true, sku: true, birim: true } } } },
};

type Durum = 'BEKLIYOR' | 'ONAYLANDI' | 'REDDEDILDI' | 'TESLIM_ALINDI' | 'IPTAL';

@Injectable()
export class PurchaseRequestsRepository {
  constructor(private prisma: PrismaService) {}

  transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  create(dto: CreatePurchaseRequestDto, requestedById: string) {
    return this.prisma.purchaseRequest.create({
      data: {
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        aciklama: dto.aciklama,
        requestedById,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            miktar: i.miktar,
            birimFiyat: i.birimFiyat,
          })),
        },
      },
      include: ILISKILER,
    });
  }

  findAllActive(durum?: Durum) {
    return this.prisma.purchaseRequest.findMany({
      where: { deletedAt: null, ...(durum ? { durum } : {}) },
      include: ILISKILER,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllDeleted() {
    return this.prisma.purchaseRequest.findMany({
      where: { deletedAt: { not: null } },
      include: ILISKILER,
      orderBy: { deletedAt: 'desc' },
    });
  }

  findActiveById(id: string, db: DbClient = this.prisma) {
    return db.purchaseRequest.findFirst({
      where: { id, deletedAt: null },
      include: ILISKILER,
    });
  }

  findById(id: string) {
    return this.prisma.purchaseRequest.findUnique({ where: { id } });
  }

  findActiveSupplier(id: string) {
    return this.prisma.supplier.findFirst({ where: { id, deletedAt: null } });
  }

  findActiveWarehouse(id: string) {
    return this.prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
  }

  countActiveProducts(ids: string[]) {
    return this.prisma.product.count({ where: { id: { in: ids }, deletedAt: null } });
  }

  // Durum geçişi: sadece beklenen durumdaysa uygulanır (yarış durumuna karşı güvenli)
  async transition(
    id: string,
    from: Durum[],
    data: {
      durum: Durum;
      decidedById?: string;
      decidedAt?: Date;
      receivedById?: string;
      receivedAt?: Date;
      redNedeni?: string | null;
    },
    db: DbClient = this.prisma,
  ) {
    const r = await db.purchaseRequest.updateMany({
      where: { id, durum: { in: from }, deletedAt: null },
      data,
    });
    return r.count === 1;
  }

  markDeleted(id: string) {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: ILISKILER,
    });
  }

  restore(id: string) {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { deletedAt: null },
      include: ILISKILER,
    });
  }

  delete(id: string) {
    return this.prisma.purchaseRequest.delete({ where: { id } });
  }
}
