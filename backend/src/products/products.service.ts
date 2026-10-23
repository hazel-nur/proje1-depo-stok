import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Kategori var mı ve silinmemiş mi kontrol eder
  private async kategoriKontrol(categoryId: string) {
    const kategori = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!kategori) {
      throw new NotFoundException('Seçilen kategori bulunamadı.');
    }
  }

  async create(dto: CreateProductDto) {
    await this.kategoriKontrol(dto.categoryId);
    const var_mi = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (var_mi) {
      throw new ConflictException('Bu stok kodu (sku) zaten kullanılıyor.');
    }
    return this.prisma.product.create({ data: dto });
  }

  findAll() {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: { select: { id: true, ad: true } } },
      orderBy: { ad: 'asc' },
    });
  }

  async findOne(id: string) {
    const urun = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: { select: { id: true, ad: true } } },
    });
    if (!urun) {
      throw new NotFoundException('Ürün bulunamadı.');
    }
    return urun;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.categoryId) {
      await this.kategoriKontrol(dto.categoryId);
    }
    if (dto.sku) {
      const baska = await this.prisma.product.findFirst({
        where: { sku: dto.sku, NOT: { id } },
      });
      if (baska) {
        throw new ConflictException('Bu stok kodu (sku) başka bir üründe kullanılıyor.');
      }
    }
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  // SOFT DELETE: kayıt silinmez, deletedAt'e tarih yazılır
  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // HARD DELETE: kayıt veritabanından tamamen silinir (sadece Admin)
  async hardDelete(id: string) {
    const urun = await this.prisma.product.findUnique({ where: { id } });
    if (!urun) {
      throw new NotFoundException('Ürün bulunamadı.');
    }
    return this.prisma.product.delete({ where: { id } });
  }
}