import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransferRequestsRepository } from './transfer-requests.repository';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { CreateTransferRequestDto } from './dto/create-transfer-request.dto';
import { DEPO } from '../auth/roles.constants';

@Injectable()
export class TransferRequestsService {
  constructor(
    private repository: TransferRequestsRepository,
    private movements: StockMovementsService,
  ) {}

  async create(dto: CreateTransferRequestDto, userId: string) {
    if (dto.sourceWarehouseId === dto.targetWarehouseId) {
      throw new BadRequestException('Kaynak ve hedef depo aynı olamaz.');
    }
    if (!(await this.repository.findActiveProduct(dto.productId))) {
      throw new NotFoundException('Ürün bulunamadı.');
    }
    if (!(await this.repository.findActiveWarehouse(dto.sourceWarehouseId))) {
      throw new NotFoundException('Kaynak depo bulunamadı.');
    }
    if (!(await this.repository.findActiveWarehouse(dto.targetWarehouseId))) {
      throw new NotFoundException('Hedef depo bulunamadı.');
    }
    return this.repository.create({ ...dto, requestedById: userId });
  }

  findAll(durum?: 'BEKLIYOR' | 'ONAYLANDI' | 'REDDEDILDI' | 'IPTAL') {
    return this.repository.findAllActive(durum);
  }

  // Admin için: soft delete yapılmış talepler
  findAllDeleted() {
    return this.repository.findAllDeleted();
  }

  async findOne(id: string) {
    const talep = await this.repository.findActiveById(id);
    if (!talep) {
      throw new NotFoundException('Transfer talebi bulunamadı.');
    }
    return talep;
  }

  /**
   * ONAY: tek transaction içinde (1) talep ONAYLANDI olur (2) stok kaynak depodan düşer,
   * hedef depoya eklenir (3) TRANSFER hareketi yazılır. Stok yetersizse hepsi geri alınır.
   */
  async approve(id: string, userId: string) {
    const talep = await this.findOne(id);
    this.bekliyorMu(talep.durum);
    return this.repository.transaction(async (tx) => {
      const ok = await this.repository.decide(id, 'ONAYLANDI', userId, undefined, tx);
      if (!ok) {
        throw new ConflictException('Bu talep zaten işlenmiş.');
      }
      await this.movements.apply(tx, {
        tip: 'TRANSFER',
        productId: talep.productId,
        miktar: talep.miktar,
        sourceWarehouseId: talep.sourceWarehouseId,
        targetWarehouseId: talep.targetWarehouseId,
        aciklama: `Transfer talebi onayı${talep.aciklama ? `: ${talep.aciklama}` : ''}`,
        userId,
        transferRequestId: id,
      });
      return this.repository.findActiveById(id, tx);
    });
  }

  async reject(id: string, userId: string, redNedeni?: string) {
    const talep = await this.findOne(id);
    this.bekliyorMu(talep.durum);
    const ok = await this.repository.decide(id, 'REDDEDILDI', userId, redNedeni);
    if (!ok) {
      throw new ConflictException('Bu talep zaten işlenmiş.');
    }
    return this.findOne(id);
  }

  // İptal: talebi açan kişi (Depo Personeli sadece kendi talebini) veya yönetici
  async cancel(id: string, userId: string, role: string) {
    const talep = await this.findOne(id);
    this.bekliyorMu(talep.durum);
    if (role === DEPO && talep.requestedById !== userId) {
      throw new ForbiddenException('Sadece kendi talebinizi iptal edebilirsiniz.');
    }
    const ok = await this.repository.decide(id, 'IPTAL', userId);
    if (!ok) {
      throw new ConflictException('Bu talep zaten işlenmiş.');
    }
    return this.findOne(id);
  }

  // SOFT DELETE: kayıt silinmez, deletedAt'e tarih yazılır
  async softDelete(id: string) {
    await this.findOne(id);
    return this.repository.markDeleted(id);
  }

  async restore(id: string) {
    const talep = await this.repository.findById(id);
    if (!talep) {
      throw new NotFoundException('Transfer talebi bulunamadı.');
    }
    if (talep.deletedAt === null) {
      throw new ConflictException('Bu talep zaten silinmemiş.');
    }
    return this.repository.restore(id);
  }

  async hardDelete(id: string) {
    const talep = await this.repository.findById(id);
    if (!talep) {
      throw new NotFoundException('Transfer talebi bulunamadı.');
    }
    return this.repository.delete(id);
  }

  private bekliyorMu(durum: string) {
    if (durum !== 'BEKLIYOR') {
      throw new ConflictException(`Talep zaten ${durum} durumunda, işlem yapılamaz.`);
    }
  }
}
