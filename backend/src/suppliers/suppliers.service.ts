import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private repository: SuppliersRepository) {}

  create(dto: CreateSupplierDto) {
    return this.repository.create(dto);
  }

  findAll() {
    return this.repository.findAllActive();
  }

  // Admin için: soft delete yapılmış tedarikçiler
  findAllDeleted() {
    return this.repository.findAllDeleted();
  }

  async findOne(id: string) {
    const tedarikci = await this.repository.findActiveById(id);
    if (!tedarikci) {
      throw new NotFoundException('Tedarikçi bulunamadı.');
    }
    return tedarikci;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.repository.update(id, dto);
  }

  // SOFT DELETE: açık satın alma talebi olan tedarikçi silinemez
  async softDelete(id: string) {
    await this.findOne(id);
    const acik = await this.repository.countOpenPurchaseRequests(id);
    if (acik > 0) {
      throw new ConflictException('Tedarikçinin açık satın alma talepleri var.');
    }
    return this.repository.markDeleted(id);
  }

  async restore(id: string) {
    const tedarikci = await this.repository.findById(id);
    if (!tedarikci) {
      throw new NotFoundException('Tedarikçi bulunamadı.');
    }
    if (tedarikci.deletedAt === null) {
      throw new ConflictException('Bu tedarikçi zaten silinmemiş.');
    }
    return this.repository.restore(id);
  }

  // HARD DELETE: satın alma geçmişi olan tedarikçi kalıcı silinemez
  async hardDelete(id: string) {
    const tedarikci = await this.repository.findById(id);
    if (!tedarikci) {
      throw new NotFoundException('Tedarikçi bulunamadı.');
    }
    const talep = await this.repository.countAllPurchaseRequests(id);
    if (talep > 0) {
      throw new ConflictException(
        'Bu tedarikçiye bağlı satın alma talepleri var, kalıcı silinemez.',
      );
    }
    return this.repository.delete(id);
  }
}
