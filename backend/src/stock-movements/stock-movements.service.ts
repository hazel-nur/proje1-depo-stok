import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementData, StockMovementsRepository } from './stock-movements.repository';
import { CreateStockEntryDto } from './dto/create-entry.dto';
import { CreateTransferMovementDto } from './dto/create-transfer-movement.dto';
import { QueryMovementsDto } from './dto/query-movements.dto';
import { DbClient } from '../shared/db.types';

@Injectable()
export class StockMovementsService {
  constructor(private repository: StockMovementsRepository) {}

  giris(dto: CreateStockEntryDto, userId: string) {
    return this.repository.transaction((tx) =>
      this.apply(tx, {
        tip: 'GIRIS',
        productId: dto.productId,
        miktar: dto.miktar,
        targetWarehouseId: dto.warehouseId,
        aciklama: dto.aciklama,
        userId,
      }),
    );
  }

  cikis(dto: CreateStockEntryDto, userId: string) {
    return this.repository.transaction((tx) =>
      this.apply(tx, {
        tip: 'CIKIS',
        productId: dto.productId,
        miktar: dto.miktar,
        sourceWarehouseId: dto.warehouseId,
        aciklama: dto.aciklama,
        userId,
      }),
    );
  }

  transfer(dto: CreateTransferMovementDto, userId: string) {
    return this.repository.transaction((tx) =>
      this.apply(tx, {
        tip: 'TRANSFER',
        productId: dto.productId,
        miktar: dto.miktar,
        sourceWarehouseId: dto.sourceWarehouseId,
        targetWarehouseId: dto.targetWarehouseId,
        aciklama: dto.aciklama,
        userId,
      }),
    );
  }

  findAll(q: QueryMovementsDto) {
    return this.repository.findAll(q);
  }

  async findOne(id: string) {
    const h = await this.repository.findById(id);
    if (!h) {
      throw new NotFoundException('Stok hareketi bulunamadı.');
    }
    return h;
  }

  /**
   * Stok hareketinin TEK doğru uygulama noktası.
   * Dışarıdan verilen transaction (tx) içinde çalışır; böylece transfer onayı,
   * satın alma teslimi ve sayım uygulama da aynı kuralları kullanır ve
   * herhangi bir adım hata verirse HEPSİ geri alınır.
   */
  async apply(tx: DbClient, data: MovementData) {
    if (!Number.isInteger(data.miktar) || data.miktar < 1) {
      throw new BadRequestException('Miktar en az 1 olmalıdır.');
    }

    const urun = await this.repository.findActiveProduct(tx, data.productId);
    if (!urun) {
      throw new NotFoundException('Ürün bulunamadı.');
    }

    if (data.tip === 'GIRIS') {
      const hedef = await this.depoGetir(tx, data.targetWarehouseId);
      await this.repository.increaseStock(tx, hedef, data.productId, data.miktar);
      await this.repository.adjustProductTotal(tx, data.productId, data.miktar);
    } else if (data.tip === 'CIKIS') {
      const kaynak = await this.depoGetir(tx, data.sourceWarehouseId);
      await this.stokDus(tx, kaynak, data.productId, data.miktar);
      await this.repository.adjustProductTotal(tx, data.productId, -data.miktar);
    } else {
      const kaynak = await this.depoGetir(tx, data.sourceWarehouseId);
      const hedef = await this.depoGetir(tx, data.targetWarehouseId);
      if (kaynak === hedef) {
        throw new BadRequestException('Kaynak ve hedef depo aynı olamaz.');
      }
      await this.stokDus(tx, kaynak, data.productId, data.miktar);
      await this.repository.increaseStock(tx, hedef, data.productId, data.miktar);
      // Toplam stok değişmez: ürün sadece depo değiştirir
    }

    return this.repository.createMovement(tx, data);
  }

  private async depoGetir(tx: DbClient, id?: string) {
    if (!id) {
      throw new BadRequestException('Depo bilgisi eksik.');
    }
    const depo = await this.repository.findActiveWarehouse(tx, id);
    if (!depo) {
      throw new NotFoundException('Depo bulunamadı.');
    }
    return depo.id;
  }

  private async stokDus(tx: DbClient, warehouseId: string, productId: string, miktar: number) {
    const ok = await this.repository.decreaseStock(tx, warehouseId, productId, miktar);
    if (!ok) {
      const mevcut = await this.repository.getStock(tx, warehouseId, productId);
      throw new ConflictException(
        `Yetersiz stok. Depodaki miktar: ${mevcut?.miktar ?? 0}, istenen: ${miktar}.`,
      );
    }
  }
}
