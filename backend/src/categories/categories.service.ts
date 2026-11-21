import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private repository: CategoriesRepository) {}

  async create(dto: CreateCategoryDto) {
    const var_mi = await this.repository.findByName(dto.ad);
    if (var_mi) {
      throw new ConflictException('Bu isimde bir kategori zaten var.');
    }
    return this.repository.create(dto);
  }

  findAll() {
    return this.repository.findAllActive();
  }

  // Admin için: soft delete yapılmış kategoriler
  findAllDeleted() {
    return this.repository.findAllDeleted();
  }

  async findOne(id: string) {
    const kategori = await this.repository.findActiveById(id);
    if (!kategori) {
      throw new NotFoundException('Kategori bulunamadı.');
    }
    return kategori;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.repository.update(id, dto);
  }

  // SOFT DELETE: kayıt silinmez, deletedAt'e tarih yazılır
  async softDelete(id: string) {
    await this.findOne(id);
    const aktifUrun = await this.repository.countActiveProducts(id);
    if (aktifUrun > 0) {
      throw new ConflictException('Bu kategoriye bağlı aktif ürünler var.');
    }
    return this.repository.markDeleted(id);
  }

  // GERİ ALMA: silinmiş kategoriyi tekrar aktif yapar (sadece Admin)
  async restore(id: string) {
    const kategori = await this.repository.findById(id);
    if (!kategori) {
      throw new NotFoundException('Kategori bulunamadı.');
    }
    if (kategori.deletedAt === null) {
      throw new ConflictException('Bu kategori zaten silinmemiş.');
    }
    return this.repository.restore(id);
  }

  // HARD DELETE: kayıt veritabanından tamamen silinir (sadece Admin)
  async hardDelete(id: string) {
    const kategori = await this.repository.findById(id);
    if (!kategori) {
      throw new NotFoundException('Kategori bulunamadı.');
    }
    const urunSayisi = await this.repository.countAllProducts(id);
    if (urunSayisi > 0) {
      throw new ConflictException('Bu kategoriye bağlı ürünler var, önce onları silin.');
    }
    return this.repository.delete(id);
  }
}