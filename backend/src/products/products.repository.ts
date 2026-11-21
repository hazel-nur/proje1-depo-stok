import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const KATEGORI_OZET = { category: { select: { id: true, ad: true } } };

@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  create(data: CreateProductDto) {
    return this.prisma.product.create({ data });
  }

  findAllActive() {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      include: KATEGORI_OZET,
      orderBy: { ad: 'asc' },
    });
  }

  findAllDeleted() {
    return this.prisma.product.findMany({
      where: { deletedAt: { not: null } },
      include: KATEGORI_OZET,
      orderBy: { deletedAt: 'desc' },
    });
  }

  findActiveById(id: string) {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: KATEGORI_OZET,
    });
  }

  findById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findBySku(sku: string) {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  // Aynı sku başka bir üründe var mı (kendisi hariç)
  findBySkuExcludingId(sku: string, id: string) {
    return this.prisma.product.findFirst({
      where: { sku, NOT: { id } },
    });
  }

  // Silinmemiş kategori var mı
  findActiveCategoryById(categoryId: string) {
    return this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
  }

  update(id: string, data: UpdateProductDto) {
    return this.prisma.product.update({ where: { id }, data });
  }

  markDeleted(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  restore(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  delete(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}