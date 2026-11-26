import { Injectable } from '@nestjs/common';
import { WarehouseStocksRepository } from './warehouse-stocks.repository';

@Injectable()
export class WarehouseStocksService {
  constructor(private repository: WarehouseStocksRepository) {}

  findAll(filter: { warehouseId?: string; productId?: string }) {
    return this.repository.findAll(filter);
  }

  // Düşük stok: her ürün için eksik miktar ve hangi depoda ne kadar olduğu
  async findLowStock() {
    const urunler = await this.repository.findLowStockProducts();
    if (urunler.length === 0) return [];
    const stoklar = await this.repository.findStocksOfProducts(urunler.map((u) => u.id));
    return urunler.map((u) => ({
      ...u,
      eksikMiktar: u.minStokSeviyesi - u.stokMiktari,
      depolar: stoklar
        .filter((s) => s.productId === u.id)
        .map((s) => ({ warehouseId: s.warehouse.id, depoAdi: s.warehouse.ad, miktar: s.miktar })),
    }));
  }
}
