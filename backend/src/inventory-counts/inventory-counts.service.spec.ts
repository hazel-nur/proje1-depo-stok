import { jest } from '@jest/globals';
import { InventoryCountsService } from './inventory-counts.service';

describe('InventoryCountsService', () => {
  const tx = { __tx: true } as any;
  let repo: any;
  let movements: any;
  let service: InventoryCountsService;

  beforeEach(() => {
    repo = {
      transaction: jest.fn((fn) => fn(tx)),
      findActiveWarehouse: jest.fn().mockResolvedValue({ id: 'w1' }),
      countActiveProducts: jest.fn().mockResolvedValue(1),
      stockMap: jest.fn().mockResolvedValue(new Map([['p1', 30]])),
      create: jest.fn(async (d) => d),
      markApplied: jest.fn().mockResolvedValue(true),
      updateItem: jest.fn().mockResolvedValue({}),
      findActiveById: jest.fn().mockResolvedValue({
        id: 'c1',
        warehouseId: 'w1',
        durum: 'ACIK',
        items: [
          { id: 'i1', productId: 'p1', sayilanMiktar: 28 },
          { id: 'i2', productId: 'p2', sayilanMiktar: 7 },
          { id: 'i3', productId: 'p3', sayilanMiktar: 4 },
        ],
      }),
    };
    movements = { apply: jest.fn().mockResolvedValue({}) };
    service = new InventoryCountsService(repo, movements);
  });

  it('oluştur: fark = gerçek − beklenen', async () => {
    const r: any = await service.create(
      { warehouseId: 'w1', items: [{ productId: 'p1', sayilanMiktar: 28 }] },
      'u1',
    );
    expect(r.items[0]).toEqual({ productId: 'p1', beklenenMiktar: 30, sayilanMiktar: 28, fark: -2 });
  });

  it('uygula: negatif farkta CIKIS, pozitifte GIRIS, sıfırda hareket yok', async () => {
    repo.stockMap.mockResolvedValue(new Map([['p1', 30], ['p2', 0], ['p3', 4]]));
    await service.apply('c1', 'u-sube');
    expect(repo.markApplied).toHaveBeenCalledWith(tx, 'c1', 'u-sube');
    expect(movements.apply).toHaveBeenCalledTimes(2);
    expect(movements.apply).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ tip: 'CIKIS', productId: 'p1', miktar: 2, sourceWarehouseId: 'w1' }),
    );
    expect(movements.apply).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ tip: 'GIRIS', productId: 'p2', miktar: 7, targetWarehouseId: 'w1' }),
    );
    expect(repo.updateItem).toHaveBeenCalledWith(tx, 'i1', 30, -2);
  });

  it('uygula: zaten uygulanmışsa 409', async () => {
    repo.markApplied.mockResolvedValue(false);
    await expect(service.apply('c1', 'u')).rejects.toThrow('zaten uygulanmış');
    expect(movements.apply).not.toHaveBeenCalled();
  });
});
