import { jest } from '@jest/globals';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';

describe('StockMovementsService', () => {
  const tx = { __tx: true } as any;
  let repo: any;
  let service: StockMovementsService;

  beforeEach(() => {
    repo = {
      transaction: jest.fn((fn) => fn(tx)),
      findActiveProduct: jest.fn().mockResolvedValue({ id: 'p1' }),
      findActiveWarehouse: jest.fn(async (_tx, id) => ({ id })),
      increaseStock: jest.fn().mockResolvedValue(undefined),
      decreaseStock: jest.fn().mockResolvedValue(true),
      adjustProductTotal: jest.fn().mockResolvedValue(undefined),
      getStock: jest.fn().mockResolvedValue({ miktar: 3 }),
      createMovement: jest.fn(async (_tx, d) => ({ id: 'm1', ...d })),
    };
    service = new StockMovementsService(repo);
  });

  it('giriş: depo stoğunu ve ürün toplamını artırır, hareket yazar (tek transaction)', async () => {
    const r = await service.giris({ productId: 'p1', warehouseId: 'w1', miktar: 10 }, 'u1');
    expect(repo.transaction).toHaveBeenCalledTimes(1);
    expect(repo.increaseStock).toHaveBeenCalledWith(tx, 'w1', 'p1', 10);
    expect(repo.adjustProductTotal).toHaveBeenCalledWith(tx, 'p1', 10);
    expect(r).toMatchObject({ tip: 'GIRIS', miktar: 10, targetWarehouseId: 'w1', userId: 'u1' });
  });

  it('çıkış: stok yeterliyse düşer ve toplamı azaltır', async () => {
    const r = await service.cikis({ productId: 'p1', warehouseId: 'w1', miktar: 2 }, 'u1');
    expect(repo.decreaseStock).toHaveBeenCalledWith(tx, 'w1', 'p1', 2);
    expect(repo.adjustProductTotal).toHaveBeenCalledWith(tx, 'p1', -2);
    expect(r.tip).toBe('CIKIS');
  });

  it('çıkış: stok yetersizse 409 verir ve hareket yazmaz', async () => {
    repo.decreaseStock.mockResolvedValue(false);
    await expect(
      service.cikis({ productId: 'p1', warehouseId: 'w1', miktar: 50 }, 'u1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.createMovement).not.toHaveBeenCalled();
    expect(repo.adjustProductTotal).not.toHaveBeenCalled();
  });

  it('transfer: kaynaktan düşer, hedefe ekler, ürün toplamını DEĞİŞTİRMEZ', async () => {
    const r = await service.transfer(
      { productId: 'p1', sourceWarehouseId: 'w1', targetWarehouseId: 'w2', miktar: 4 },
      'u1',
    );
    expect(repo.decreaseStock).toHaveBeenCalledWith(tx, 'w1', 'p1', 4);
    expect(repo.increaseStock).toHaveBeenCalledWith(tx, 'w2', 'p1', 4);
    expect(repo.adjustProductTotal).not.toHaveBeenCalled();
    expect(r.tip).toBe('TRANSFER');
  });

  it('transfer: kaynak ve hedef aynıysa 400', async () => {
    await expect(
      service.transfer(
        { productId: 'p1', sourceWarehouseId: 'w1', targetWarehouseId: 'w1', miktar: 1 },
        'u1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ürün veya depo bulunamazsa 404', async () => {
    repo.findActiveProduct.mockResolvedValue(null);
    await expect(
      service.giris({ productId: 'yok', warehouseId: 'w1', miktar: 1 }, 'u1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    repo.findActiveProduct.mockResolvedValue({ id: 'p1' });
    repo.findActiveWarehouse.mockResolvedValue(null);
    await expect(
      service.giris({ productId: 'p1', warehouseId: 'yok', miktar: 1 }, 'u1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('miktar 1den küçükse 400', async () => {
    await expect(
      service.apply(tx, { tip: 'GIRIS', productId: 'p1', miktar: 0, targetWarehouseId: 'w1', userId: 'u' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
