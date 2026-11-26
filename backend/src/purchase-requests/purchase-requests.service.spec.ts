import { jest } from '@jest/globals';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PurchaseRequestsService } from './purchase-requests.service';

describe('PurchaseRequestsService', () => {
  const tx = { __tx: true } as any;
  let repo: any;
  let movements: any;
  let service: PurchaseRequestsService;
  const talep = {
    id: 'r1',
    warehouseId: 'w1',
    supplier: { ad: 'Ted' },
    requestedById: 'u-sat',
    items: [
      { productId: 'p1', miktar: 10, birimFiyat: 5 },
      { productId: 'p2', miktar: 2, birimFiyat: 100 },
    ],
  };

  beforeEach(() => {
    repo = {
      transaction: jest.fn((fn) => fn(tx)),
      findActiveById: jest.fn().mockResolvedValue(talep),
      findActiveSupplier: jest.fn().mockResolvedValue({ id: 's1' }),
      findActiveWarehouse: jest.fn().mockResolvedValue({ id: 'w1' }),
      countActiveProducts: jest.fn().mockResolvedValue(2),
      transition: jest.fn().mockResolvedValue(true),
      create: jest.fn(async () => talep),
    };
    movements = { apply: jest.fn().mockResolvedValue({}) };
    service = new PurchaseRequestsService(repo, movements);
  });

  it('teslim al: her kalem için depoya GIRIS hareketi uygular (tek transaction)', async () => {
    await service.receive('r1', 'u-depo');
    expect(repo.transaction).toHaveBeenCalledTimes(1);
    expect(repo.transition).toHaveBeenCalledWith('r1', ['ONAYLANDI'], expect.objectContaining({ durum: 'TESLIM_ALINDI' }), tx);
    expect(movements.apply).toHaveBeenCalledTimes(2);
    expect(movements.apply).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ tip: 'GIRIS', productId: 'p1', miktar: 10, targetWarehouseId: 'w1', purchaseRequestId: 'r1' }),
    );
  });

  it('teslim al: ONAYLANDI değilse 409 ve stok girişi yok', async () => {
    repo.transition.mockResolvedValue(false);
    await expect(service.receive('r1', 'u')).rejects.toBeInstanceOf(ConflictException);
    expect(movements.apply).not.toHaveBeenCalled();
  });

  it('oluştur: toplam tutarı hesaplar, tekrar eden ürünü reddeder', async () => {
    const r: any = await service.create(
      { supplierId: 's1', warehouseId: 'w1', items: [{ productId: 'p1', miktar: 10, birimFiyat: 5 }, { productId: 'p2', miktar: 2, birimFiyat: 100 }] },
      'u',
    );
    expect(r.toplamTutar).toBe(250);
    await expect(
      service.create(
        { supplierId: 's1', warehouseId: 'w1', items: [{ productId: 'p1', miktar: 1, birimFiyat: 1 }, { productId: 'p1', miktar: 1, birimFiyat: 1 }] },
        'u',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
