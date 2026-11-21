import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  create(data: CreateCategoryDto) {
    return this.prisma.category.create({ data });
  }

  // Silinmemiş kategoriler
  findAllActive() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { ad: 'asc' },
    });
  }

  // Sadece soft delete yapılmış kategoriler
  findAllDeleted() {
    return this.prisma.category.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  // Silinmemiş tek kategori
  findActiveById(id: string) {
    return this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
  }

  // Silinmiş olsun olmasın tek kategori
  findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findByName(ad: string) {
    return this.prisma.category.findUnique({ where: { ad } });
  }

  update(id: string, data: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data });
  }

  markDeleted(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  restore(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  countActiveProducts(categoryId: string) {
    return this.prisma.product.count({
      where: { categoryId, deletedAt: null },
    });
  }

  countAllProducts(categoryId: string) {
    return this.prisma.product.count({ where: { categoryId } });
  }
}