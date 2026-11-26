import { jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransferRequestsService } from './transfer-requests.service';

const talep = (o: any = {}) => ({
  id: 't1',
  durum: 'BEKLIYOR',
  productId: 'p1',
  miktar: 5,
  sourceWarehouseId: 'w1',
  targetWarehouseId: 'w2',
  requestedById: 'u-depo',
  aciklama: null,
  ...o,
});

describe('TransferRequestsService', () => {
  const tx = { __tx: true } as any;
  let repo: any;
  let movements: any;
  let service: TransferRequestsService;

  beforeEach(() => {
    repo = {
      transaction: jest.fn((fn) => fn(tx)),
      findActiveById: jest.fn().mockResolvedValue(talep()),
      findById: jest.fn(),
      findActiveProduct: jest.fn().mockResolvedValue({ id: 'p1' }),
      findActiveWarehouse: jest.fn().mockResolvedValue({ id: 'w' }),
      decide: jest.fn().mockResolvedValue(true),
      create: jest.fn(async (d) => ({ id: 't1', durum: 'BEKLIYOR', ...d })),
    };
    movements = { apply: jest.fn().mockResolvedValue({ id: 'm1' }) };
    service = new TransferRequestsService(repo, movements);
  });

  it('talep açar (BEKLIYOR) ve açan kişiyi kaydeder', async () => {
    const r = await service.create(
      { productId: 'p1', sourceWarehouseId: 'w1', targetWarehouseId: 'w2', miktar: 3 },
      'u-depo',
    );
    expect(r).toMatchObject({ requestedById: 'u-depo', durum: 'BEKLIYOR' });
  });

  it('aynı depoya talep açılamaz', async () => {
    await expect(
      service.create({ productId: 'p1', sourceWarehouseId: 'w1', targetWarehouseId: 'w1', miktar: 1 }, 'u'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('onay: aynı transaction içinde durumu günceller ve TRANSFER hareketi uygular', async () => {
    await service.approve('t1', 'u-sube');
    expect(repo.transaction).toHaveBeenCalledTimes(1);
    expect(repo.decide).toHaveBeenCalledWith('t1', 'ONAYLANDI', 'u-sube', undefined, tx);
    expect(movements.apply).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        tip: 'TRANSFER',
        productId: 'p1',
        miktar: 5,
        sourceWarehouseId: 'w1',
        targetWarehouseId: 'w2',
        transferRequestId: 't1',
        userId: 'u-sube',
      }),
    );
  });

  it('onay: stok hatası transaction dışına taşınır (talep onaylanmış kalmaz)', async () => {
    movements.apply.mockRejectedValue(new ConflictException('Yetersiz stok'));
    await expect(service.approve('t1', 'u')).rejects.toBeInstanceOf(ConflictException);
  });

  it('onay: BEKLIYOR olmayan talep onaylanamaz', async () => {
    repo.findActiveById.mockResolvedValue(talep({ durum: 'ONAYLANDI' }));
    await expect(service.approve('t1', 'u')).rejects.toBeInstanceOf(ConflictException);
    expect(movements.apply).not.toHaveBeenCalled();
  });

  it('onay: yarış durumunda (decide=false) hareket uygulanmaz', async () => {
    repo.decide.mockResolvedValue(false);
    await expect(service.approve('t1', 'u')).rejects.toBeInstanceOf(ConflictException);
    expect(movements.apply).not.toHaveBeenCalled();
  });

  it('red: nedeniyle birlikte REDDEDILDI yapar, stok hareketi yok', async () => {
    await service.reject('t1', 'u-sube', 'uygun değil');
    expect(repo.decide).toHaveBeenCalledWith('t1', 'REDDEDILDI', 'u-sube', 'uygun değil');
    expect(movements.apply).not.toHaveBeenCalled();
  });

  it('iptal: Depo Personeli başkasının talebini iptal edemez', async () => {
    await expect(service.cancel('t1', 'baska-kisi', 'Depo Personeli')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.cancel('t1', 'u-depo', 'Depo Personeli')).resolves.toBeDefined();
  });

  it('bulunamayan talep 404', async () => {
    repo.findActiveById.mockResolvedValue(null);
    await expect(service.findOne('yok')).rejects.toBeInstanceOf(NotFoundException);
  });
});
