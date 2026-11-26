import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { DbClient } from '../shared/db.types';
import { CreateTransferRequestDto } from './dto/create-transfer-request.dto';

const ILISKILER = {
  product: { select: { id: true, ad: true, sku: true } },
  sourceWarehouse: { select: { id: true, ad: true } },
  targetWarehouse: { select: { id: true, ad: true } },
  requestedBy: { select: { id: true, ad: true } },
  decidedBy: { select: { id: true, ad: true } },
};

type Durum = 'BEKLIYOR' | 'ONAYLANDI' | 'REDDEDILDI' | 'IPTAL';

@Injectable()
export class TransferRequestsRepository {
  constructor(private prisma: PrismaService) {}

  transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  create(data: CreateTransferRequestDto & { requestedById: string }) {
    return this.prisma.transferRequest.create({ data, include: ILISKILER });
  }

  findAllActive(durum?: Durum) {
    return this.prisma.transferRequest.findMany({
      where: { deletedAt: null, ...(durum ? { durum } : {}) },
      include: ILISKILER,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllDeleted() {
    return this.prisma.transferRequest.findMany({
      where: { deletedAt: { not: null } },
      include: ILISKILER,
      orderBy: { deletedAt: 'desc' },
    });
  }

  findActiveById(id: string, db: DbClient = this.prisma) {
    return db.transferRequest.findFirst({
      where: { id, deletedAt: null },
      include: ILISKILER,
    });
  }

  findById(id: string) {
    return this.prisma.transferRequest.findUnique({ where: { id } });
  }

  findActiveProduct(id: string) {
    return this.prisma.product.findFirst({ where: { id, deletedAt: null } });
  }

  findActiveWarehouse(id: string) {
    return this.prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
  }

  // Sadece BEKLIYOR durumundaki talebi karara bağlar. true = başarılı (yarış durumuna karşı güvenli)
  async decide(
    id: string,
    durum: Exclude<Durum, 'BEKLIYOR'>,
    userId: string,
    redNedeni?: string,
    db: DbClient = this.prisma,
  ) {
    const r = await db.transferRequest.updateMany({
      where: { id, durum: 'BEKLIYOR', deletedAt: null },
      data: { durum, decidedById: userId, decidedAt: new Date(), redNedeni: redNedeni ?? null },
    });
    return r.count === 1;
  }

  markDeleted(id: string) {
    return this.prisma.transferRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: ILISKILER,
    });
  }

  restore(id: string) {
    return this.prisma.transferRequest.update({
      where: { id },
      data: { deletedAt: null },
      include: ILISKILER,
    });
  }

  delete(id: string) {
    return this.prisma.transferRequest.delete({ where: { id } });
  }
}
