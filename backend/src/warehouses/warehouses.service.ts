import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { WarehousesRepository } from './warehouses.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private repository: WarehousesRepository) {}

  async create(dto: CreateWarehouseDto) {
    const var_mi = await this.repository.findByName(dto.ad);
    if (var_mi) {
      throw new ConflictException('Bu isimde bir depo zaten var.');
    }
    return this.repository.create(dto);
  }

  findAll() {
    return this.repository.findAllActive();
  }

  // Admin için: soft delete yapılmış depolar
  findAllDeleted() {
    return this.repository.findAllDeleted();
  }

  async findOne(id: string) {
    const depo = await this.repository.findActiveById(id);
    if (!depo) {
      throw new NotFoundException('Depo bulunamadı.');
    }
    return depo;
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.findOne(id);
    if (dto.ad) {
      const baska = await this.repository.findByName(dto.ad);
      if (baska && baska.id !== id) {
        throw new ConflictException('Bu isimde bir depo zaten var.');
      }
    }
    return this.repository.update(id, dto);
  }

  // SOFT DELETE: içinde stok kalan depo silinemez
  async softDelete(id: string) {
    await this.findOne(id);
    const stok = await this.repository.totalStock(id);
    if (stok > 0) {
      throw new ConflictException('Depoda stok var, önce stoğu başka depoya taşıyın.');
    }
    return this.repository.markDeleted(id);
  }

  async restore(id: string) {
    const depo = await this.repository.findById(id);
    if (!depo) {
      throw new NotFoundException('Depo bulunamadı.');
    }
    if (depo.deletedAt === null) {
      throw new ConflictException('Bu depo zaten silinmemiş.');
    }
    return this.repository.restore(id);
  }

  // HARD DELETE: hareket/talep/sayım geçmişi olan depo kalıcı silinemez (denetim izi korunur)
  async hardDelete(id: string) {
    const depo = await this.repository.findById(id);
    if (!depo) {
      throw new NotFoundException('Depo bulunamadı.');
    }
    const bagli = await this.repository.countRelatedRecords(id);
    if (bagli > 0) {
      throw new ConflictException(
        'Bu depoya bağlı hareket/talep/sayım kayıtları var, kalıcı silinemez.',
      );
    }
    return this.repository.delete(id);
  }
}
