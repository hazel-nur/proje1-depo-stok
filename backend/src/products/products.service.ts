import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private repository: ProductsRepository) {}

  // Kategori var mı ve silinmemiş mi kontrol eder
  private async kategoriKontrol(categoryId: string) {
    const kategori = await this.repository.findActiveCategoryById(categoryId);
    if (!kategori) {
      throw new NotFoundException('Seçilen kategori bulunamadı.');
    }
  }

  async create(dto: CreateProductDto) {
    await this.kategoriKontrol(dto.categoryId);
    const var_mi = await this.repository.findBySku(dto.sku);
    if (var_mi) {
      throw new ConflictException('Bu stok kodu (sku) zaten kullanılıyor.');
    }
    return this.repository.create(dto);
  }

  findAll() {
    return this.repository.findAllActive();
  }

  // Admin için: soft delete yapılmış ürünler
  findAllDeleted() {
    return this.repository.findAllDeleted();
  }

  async findOne(id: string) {
    const urun = await this.repository.findActiveById(id);
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
      const baska = await this.repository.findBySkuExcludingId(dto.sku, id);
      if (baska) {
        throw new ConflictException('Bu stok kodu (sku) başka bir üründe kullanılıyor.');
      }
    }
    return this.repository.update(id, dto);
  }

  // SOFT DELETE: kayıt silinmez, deletedAt'e tarih yazılır
  async softDelete(id: string) {
    await this.findOne(id);
    return this.repository.markDeleted(id);
  }

  // GERİ ALMA: silinmiş ürünü tekrar aktif yapar (sadece Admin)
  async restore(id: string) {
    const urun = await this.repository.findById(id);
    if (!urun) {
      throw new NotFoundException('Ürün bulunamadı.');
    }
    if (urun.deletedAt === null) {
      throw new ConflictException('Bu ürün zaten silinmemiş.');
    }
    // Kategorisi silinmişse ürün geri alınamaz
    const kategori = await this.repository.findActiveCategoryById(urun.categoryId);
    if (!kategori) {
      throw new ConflictException('Ürünün kategorisi silinmiş, önce kategoriyi geri alın.');
    }
    return this.repository.restore(id);
  }

  // HARD DELETE: kayıt veritabanından tamamen silinir (sadece Admin)
  async hardDelete(id: string) {
    const urun = await this.repository.findById(id);
    if (!urun) {
      throw new NotFoundException('Ürün bulunamadı.');
    }
    return this.repository.delete(id);
  }
}