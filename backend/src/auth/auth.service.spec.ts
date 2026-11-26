import { jest } from '@jest/globals';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let repo: any;
  let jwt: JwtService;
  let service: AuthService;
  let user: any;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
  });

  beforeEach(async () => {
    jwt = new JwtService({ secret: 'test-access' });
    user = {
      id: 'u1',
      ad: 'Test',
      email: 'test@depo.com',
      role: 'Depo Personeli',
      sifreHash: await bcrypt.hash('Sifre123', 4),
      refreshTokenHash: null,
      deletedAt: null,
    };
    repo = {
      findByEmail: jest.fn().mockResolvedValue(user),
      findById: jest.fn().mockImplementation(async () => user),
      create: jest.fn(async (d) => ({ id: 'u2', createdAt: new Date(), deletedAt: null, refreshTokenHash: null, ...d })),
      setRefreshTokenHash: jest.fn(async (_id, h) => {
        user.refreshTokenHash = h;
      }),
    };
    service = new AuthService(repo, jwt);
  });

  it('register: rol ne istenirse istensin Depo Personeli olur, şifre hash gizlenir', async () => {
    repo.findByEmail.mockResolvedValue(null);
    const r: any = await service.register({ ad: 'A', email: 'a@a.com', sifre: '123456', role: 'Admin' } as any);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'Depo Personeli' }));
    expect(r.sifreHash).toBeUndefined();
    expect(r.refreshTokenHash).toBeUndefined();
  });

  it('register: aynı email 409', async () => {
    await expect(service.register({ ad: 'A', email: 'test@depo.com', sifre: '123456' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('login: doğru şifreyle access + refresh döner, refresh hash saklanır', async () => {
    const r: any = await service.login({ email: 'test@depo.com', sifre: 'Sifre123' });
    expect(r.access_token).toBeTruthy();
    expect(r.refresh_token).toBeTruthy();
    expect(r.user.sifreHash).toBeUndefined();
    expect(user.refreshTokenHash).toBe(createHash('sha256').update(r.refresh_token).digest('hex'));
    const payload: any = jwt.decode(r.access_token);
    expect(payload.exp - payload.iat).toBe(15 * 60);
    const rp: any = jwt.decode(r.refresh_token);
    expect(rp.exp - rp.iat).toBe(7 * 24 * 3600);
  });

  it('login: yanlış şifre, olmayan ve silinmiş kullanıcı 401', async () => {
    await expect(service.login({ email: 'test@depo.com', sifre: 'yanlis' })).rejects.toBeInstanceOf(UnauthorizedException);
    repo.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'x@x.com', sifre: 'Sifre123' })).rejects.toBeInstanceOf(UnauthorizedException);
    repo.findByEmail.mockResolvedValue({ ...user, deletedAt: new Date() });
    await expect(service.login({ email: 'test@depo.com', sifre: 'Sifre123' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh: rotation - yeni çift verir, eski refresh token artık geçersiz', async () => {
    const l: any = await service.login({ email: 'test@depo.com', sifre: 'Sifre123' });
    const r: any = await service.refresh(l.refresh_token);
    expect(r.refresh_token).not.toBe(l.refresh_token);
    await expect(service.refresh(l.refresh_token)).rejects.toBeInstanceOf(UnauthorizedException);
    // reuse algılanınca oturum tamamen kapanır
    expect(user.refreshTokenHash).toBeNull();
    await expect(service.refresh(r.refresh_token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh: bozuk token ve access token (yanlış secret) reddedilir', async () => {
    await expect(service.refresh('bozuk')).rejects.toBeInstanceOf(UnauthorizedException);
    const l: any = await service.login({ email: 'test@depo.com', sifre: 'Sifre123' });
    await expect(service.refresh(l.access_token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh: silinmiş kullanıcı yenileyemez', async () => {
    const l: any = await service.login({ email: 'test@depo.com', sifre: 'Sifre123' });
    user.deletedAt = new Date();
    await expect(service.refresh(l.refresh_token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout: refresh hash temizlenir ve sonrasında refresh çalışmaz', async () => {
    const l: any = await service.login({ email: 'test@depo.com', sifre: 'Sifre123' });
    await service.logout('u1');
    expect(user.refreshTokenHash).toBeNull();
    await expect(service.refresh(l.refresh_token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
