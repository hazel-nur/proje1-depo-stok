import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseRequestsRepository } from './purchase-requests.repository';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { SATINALMA } from '../auth/roles.constants';

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private repository: PurchaseRequestsRepository,
    private movements: StockMovementsService,
  ) {}

  // Talep + kalemler + toplam tutar (kalem miktar x birim fiyat)
  private withTotal<T extends { items: { miktar: number; birimFiyat: number }[] } | null>(talep: T) {
    if (!talep) return talep;
    const toplamTutar = talep.items.reduce((t, i) => t + i.miktar * i.birimFiyat, 0);
    return { ...talep, toplamTutar };
  }

  async create(dto: CreatePurchaseRequestDto, userId: string) {
    const urunIdleri = dto.items.map((i) => i.productId);
    if (new Set(urunIdleri).size !== urunIdleri.length) {
      throw new BadRequestException('Aynı ürün birden fazla kalemde yer alamaz.');
    }
    if (!(await this.repository.findActiveSupplier(dto.supplierId))) {
      throw new NotFoundException('Tedarikçi bulunamadı.');
    }
    if (!(await this.repository.findActiveWarehouse(dto.warehouseId))) {
      throw new NotFoundException('Depo bulunamadı.');
    }
    if ((await this.repository.countActiveProducts(urunIdleri)) !== urunIdleri.length) {
      throw new NotFoundException('Kalemlerdeki ürünlerden biri bulunamadı.');
    }
    return this.withTotal(await this.repository.create(dto, userId));
  }

  async findAll(durum?: Parameters<PurchaseRequestsRepository['findAllActive']>[0]) {
    const liste = await this.repository.findAllActive(durum);
    return liste.map((t) => this.withTotal(t));
  }

  // Admin için: soft delete yapılmış talepler
  async findAllDeleted() {
    const liste = await this.repository.findAllDeleted();
    return liste.map((t) => this.withTotal(t));
  }

  async findOne(id: string) {
    const talep = await this.repository.findActiveById(id);
    if (!talep) {
      throw new NotFoundException('Satın alma talebi bulunamadı.');
    }
    return this.withTotal(talep)!;
  }

  async approve(id: string, userId: string) {
    await this.findOne(id);
    const ok = await this.repository.transition(id, ['BEKLIYOR'], {
      durum: 'ONAYLANDI',
      decidedById: userId,
      decidedAt: new Date(),
    });
    if (!ok) {
      throw new ConflictException('Sadece BEKLIYOR durumundaki talep onaylanabilir.');
    }
    return this.findOne(id);
  }

  async reject(id: string, userId: string, redNedeni?: string) {
    await this.findOne(id);
    const ok = await this.repository.transition(id, ['BEKLIYOR'], {
      durum: 'REDDEDILDI',
      decidedById: userId,
      decidedAt: new Date(),
      redNedeni: redNedeni ?? null,
    });
    if (!ok) {
      throw new ConflictException('Sadece BEKLIYOR durumundaki talep reddedilebilir.');
    }
    return this.findOne(id);
  }

  // İptal: bekleyen veya onaylı (henüz teslim alınmamış) talep
  async cancel(id: string, userId: string, role: string) {
    const talep = await this.findOne(id);
    if (role === SATINALMA && talep.requestedById !== userId) {
      throw new ForbiddenException('Sadece kendi talebinizi iptal edebilirsiniz.');
    }
    const ok = await this.repository.transition(id, ['BEKLIYOR', 'ONAYLANDI'], {
      durum: 'IPTAL',
    });
    if (!ok) {
      throw new ConflictException('Bu talep iptal edilemez (teslim alınmış ya da zaten sonuçlanmış).');
    }
    return this.findOne(id);
  }

  /**
   * TESLİM AL: ONAYLANDI -> TESLIM_ALINDI ve her kalem için depoya stok girişi.
   * Hepsi tek transaction: bir kalem hata verirse stok da durum da geri alınır.
   */
  async receive(id: string, userId: string) {
    const talep = await this.findOne(id);
    await this.repository.transaction(async (tx) => {
      const ok = await this.repository.transition(
        id,
        ['ONAYLANDI'],
        { durum: 'TESLIM_ALINDI', receivedById: userId, receivedAt: new Date() },
        tx,
      );
      if (!ok) {
        throw new ConflictException('Sadece ONAYLANDI durumundaki talep teslim alınabilir.');
      }
      for (const kalem of talep.items) {
        await this.movements.apply(tx, {
          tip: 'GIRIS',
          productId: kalem.productId,
          miktar: kalem.miktar,
          targetWarehouseId: talep.warehouseId,
          aciklama: `Satın alma teslimi (${talep.supplier.ad})`,
          userId,
          purchaseRequestId: id,
        });
      }
    });
    return this.findOne(id);
  }

  // SOFT DELETE: kayıt silinmez, deletedAt'e tarih yazılır
  async softDelete(id: string) {
    await this.findOne(id);
    return this.withTotal(await this.repository.markDeleted(id));
  }

  async restore(id: string) {
    const talep = await this.repository.findById(id);
    if (!talep) {
      throw new NotFoundException('Satın alma talebi bulunamadı.');
    }
    if (talep.deletedAt === null) {
      throw new ConflictException('Bu talep zaten silinmemiş.');
    }
    return this.withTotal(await this.repository.restore(id));
  }

  async hardDelete(id: string) {
    const talep = await this.repository.findById(id);
    if (!talep) {
      throw new NotFoundException('Satın alma talebi bulunamadı.');
    }
    return this.repository.delete(id);
  }
}
