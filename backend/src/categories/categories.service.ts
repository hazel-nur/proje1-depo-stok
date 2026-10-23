import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const var_mi = await this.prisma.category.findUnique({ where: { ad: dto.ad } });
    if (var_mi) {
      throw new ConflictException('Bu isimde bir kategori zaten var.');
    }
    return this.prisma.category.create({ data: dto });
  }

  findAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { ad: 'asc' },
    });
  }

  async findOne(id: string) {
    const kategori = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!kategori) {
      throw new NotFoundException('Kategori bulunamadı.');
    }
    return kategori;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  // SOFT DELETE: kayıt silinmez, deletedAt'e tarih yazılır
  async softDelete(id: string) {
    await this.findOne(id);
    const aktifUrun = await this.prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (aktifUrun > 0) {
      throw new ConflictException('Bu kategoriye bağlı aktif ürünler var.');
    }
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // HARD DELETE: kayıt veritabanından tamamen silinir (sadece Admin)
  async hardDelete(id: string) {
    const kategori = await this.prisma.category.findUnique({ where: { id } });
    if (!kategori) {
      throw new NotFoundException('Kategori bulunamadı.');
    }
    const urunSayisi = await this.prisma.product.count({ where: { categoryId: id } });
    if (urunSayisi > 0) {
      throw new ConflictException('Bu kategoriye bağlı ürünler var, önce onları silin.');
    }
    return this.prisma.category.delete({ where: { id } });
  }
}