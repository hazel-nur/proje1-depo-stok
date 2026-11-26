import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersRepository {
  constructor(private prisma: PrismaService) {}

  create(data: CreateSupplierDto) {
    return this.prisma.supplier.create({ data });
  }

  findAllActive() {
    return this.prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { ad: 'asc' },
    });
  }

  findAllDeleted() {
    return this.prisma.supplier.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  findActiveById(id: string) {
    return this.prisma.supplier.findFirst({ where: { id, deletedAt: null } });
  }

  findById(id: string) {
    return this.prisma.supplier.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateSupplierDto) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  markDeleted(id: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  restore(id: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  delete(id: string) {
    return this.prisma.supplier.delete({ where: { id } });
  }

  // Bekleyen / onaylı (henüz teslim alınmamış) talepler
  countOpenPurchaseRequests(supplierId: string) {
    return this.prisma.purchaseRequest.count({
      where: {
        supplierId,
        deletedAt: null,
        durum: { in: ['BEKLIYOR', 'ONAYLANDI'] },
      },
    });
  }

  countAllPurchaseRequests(supplierId: string) {
    return this.prisma.purchaseRequest.count({ where: { supplierId } });
  }
}
