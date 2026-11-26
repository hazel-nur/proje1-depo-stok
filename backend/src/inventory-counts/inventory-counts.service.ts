import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryCountsRepository, KalemVeri } from './inventory-counts.repository';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { CountItemDto, CreateInventoryCountDto } from './dto/create-inventory-count.dto';
import { UpdateInventoryCountDto } from './dto/update-inventory-count.dto';

@Injectable()
export class InventoryCountsService {
  constructor(
    private repository: InventoryCountsRepository,
    private movements: StockMovementsService,
  ) {}

  // Kalemleri doğrular ve "beklenen" miktarı depodaki mevcut stoktan alır. fark = gerçek - beklenen
  private async kalemleriHazirla(warehouseId: string, items: CountItemDto[]): Promise<KalemVeri[]> {
    const ids = items.map((i) => i.productId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Aynı ürün birden fazla kalemde yer alamaz.');
    }
    if ((await this.repository.countActiveProducts(ids)) !== ids.length) {
      throw new NotFoundException('Kalemlerdeki ürünlerden biri bulunamadı.');
    }
    const stok = await this.repository.stockMap(warehouseId, ids);
    return items.map((i) => {
      const beklenen = stok.get(i.productId) ?? 0;
      return {
        productId: i.productId,
        beklenenMiktar: beklenen,
        sayilanMiktar: i.sayilanMiktar,
        fark: i.sayilanMiktar - beklenen,
      };
    });
  }

  async create(dto: CreateInventoryCountDto, userId: string) {
    if (!(await this.repository.findActiveWarehouse(dto.warehouseId))) {
      throw new NotFoundException('Depo bulunamadı.');
    }
    const items = await this.kalemleriHazirla(dto.warehouseId, dto.items);
    return this.repository.create({
      warehouseId: dto.warehouseId,
      aciklama: dto.aciklama,
      createdById: userId,
      items,
    });
  }

  findAll() {
    return this.repository.findAllActive();
  }

  // Admin için: soft delete yapılmış sayımlar
  findAllDeleted() {
    return this.repository.findAllDeleted();
  }

  async findOne(id: string) {
    const sayim = await this.repository.findActiveById(id);
    if (!sayim) {
      throw new NotFoundException('Sayım bulunamadı.');
    }
    return sayim;
  }

  async update(id: string, dto: UpdateInventoryCountDto) {
    const sayim = await this.findOne(id);
    if (sayim.durum !== 'ACIK') {
      throw new ConflictException('Uygulanmış sayım değiştirilemez.');
    }
    const items = dto.items
      ? await this.kalemleriHazirla(sayim.warehouseId, dto.items)
      : undefined;
    return this.repository.update(id, dto.aciklama, items);
  }

  /**
   * UYGULA: her kalem için fark = gerçek − beklenen hesaplanır; fark pozitifse GIRIS,
   * negatifse CIKIS hareketi yazılır ve depo stoğu sayılan miktara eşitlenir.
   * Beklenen miktar uygulama anındaki güncel stoktan yeniden okunur. Tek transaction.
   */
  async apply(id: string, userId: string) {
    const sayim = await this.findOne(id);
    await this.repository.transaction(async (tx) => {
      const ok = await this.repository.markApplied(tx, id, userId);
      if (!ok) {
        throw new ConflictException('Bu sayım zaten uygulanmış.');
      }
      const stok = await this.repository.stockMap(
        sayim.warehouseId,
        sayim.items.map((i) => i.productId),
        tx,
      );
      for (const kalem of sayim.items) {
        const beklenen = stok.get(kalem.productId) ?? 0;
        const fark = kalem.sayilanMiktar - beklenen;
        await this.repository.updateItem(tx, kalem.id, beklenen, fark);
        if (fark === 0) continue;
        await this.movements.apply(tx, {
          tip: fark > 0 ? 'GIRIS' : 'CIKIS',
          productId: kalem.productId,
          miktar: Math.abs(fark),
          ...(fark > 0
            ? { targetWarehouseId: sayim.warehouseId }
            : { sourceWarehouseId: sayim.warehouseId }),
          aciklama: `Sayım düzeltmesi (beklenen ${beklenen}, sayılan ${kalem.sayilanMiktar})`,
          userId,
          inventoryCountId: id,
        });
      }
    });
    return this.findOne(id);
  }

  // SOFT DELETE: kayıt silinmez, deletedAt'e tarih yazılır
  async softDelete(id: string) {
    await this.findOne(id);
    return this.repository.markDeleted(id);
  }

  async restore(id: string) {
    const sayim = await this.repository.findById(id);
    if (!sayim) {
      throw new NotFoundException('Sayım bulunamadı.');
    }
    if (sayim.deletedAt === null) {
      throw new ConflictException('Bu sayım zaten silinmemiş.');
    }
    return this.repository.restore(id);
  }

  async hardDelete(id: string) {
    const sayim = await this.repository.findById(id);
    if (!sayim) {
      throw new NotFoundException('Sayım bulunamadı.');
    }
    return this.repository.delete(id);
  }
}
