import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesRepository {
  constructor(private prisma: PrismaService) {}

  create(data: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data });
  }

  findAllActive() {
    return this.prisma.warehouse.findMany({
      where: { deletedAt: null },
      orderBy: { ad: 'asc' },
    });
  }

  findAllDeleted() {
    return this.prisma.warehouse.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  findActiveById(id: string) {
    return this.prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
  }

  findById(id: string) {
    return this.prisma.warehouse.findUnique({ where: { id } });
  }

  findByName(ad: string) {
    return this.prisma.warehouse.findUnique({ where: { ad } });
  }

  update(id: string, data: UpdateWarehouseDto) {
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  markDeleted(id: string) {
    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  restore(id: string) {
    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  delete(id: string) {
    return this.prisma.warehouse.delete({ where: { id } });
  }

  // Depoda kalan toplam stok adedi
  async totalStock(warehouseId: string) {
    const r = await this.prisma.warehouseStock.aggregate({
      where: { warehouseId },
      _sum: { miktar: true },
    });
    return r._sum.miktar ?? 0;
  }

  // Hard delete'i engelleyen bağlı kayıtlar (hareket, talep, sayım)
  async countRelatedRecords(warehouseId: string) {
    const [m, t, p, c] = await Promise.all([
      this.prisma.stockMovement.count({
        where: {
          OR: [{ sourceWarehouseId: warehouseId }, { targetWarehouseId: warehouseId }],
        },
      }),
      this.prisma.transferRequest.count({
        where: {
          OR: [{ sourceWarehouseId: warehouseId }, { targetWarehouseId: warehouseId }],
        },
      }),
      this.prisma.purchaseRequest.count({ where: { warehouseId } }),
      this.prisma.inventoryCount.count({ where: { warehouseId } }),
    ]);
    return m + t + p + c;
  }
}
