import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DEPO } from './roles.constants';

export const ACCESS_TTL = '15m';
export const REFRESH_TTL = '7d';

@Injectable()
export class AuthService {
  constructor(
    private repository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async hashPassword(plainPassword: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(plainPassword, saltRounds);
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.repository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Bu email adresi zaten kayıtlı.');
    }

    const sifreHash = await this.hashPassword(dto.sifre);

    const user = await this.repository.create({
      ad: dto.ad,
      email: dto.email,
      sifreHash: sifreHash,
      role: DEPO,
    });

    return this.guvenliKullanici(user);
  }

  async login(dto: LoginDto) {
    const user = await this.repository.findByEmail(dto.email);

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('Email veya şifre hatalı.');
    }

    const sifreDogruMu = await this.comparePassword(dto.sifre, user.sifreHash);
    if (!sifreDogruMu) {
      throw new UnauthorizedException('Email veya şifre hatalı.');
    }

    const tokens = await this.tokenUret(user);
    return { ...tokens, user: this.guvenliKullanici(user) };
  }

  // Refresh token ROTATION: her yenilemede yeni çift üretilir, eski refresh token geçersiz olur.
  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Refresh token geçersiz veya süresi dolmuş.');
    }

    const user = await this.repository.findById(payload.sub);
    if (!user || user.deletedAt !== null || !user.refreshTokenHash) {
      throw new UnauthorizedException('Oturum geçersiz, tekrar giriş yapın.');
    }

    if (!this.hashEslesiyor(refreshToken, user.refreshTokenHash)) {
      // Eski (kullanılmış) token tekrar gelirse: olası çalıntı, oturumu kapat
      await this.repository.setRefreshTokenHash(user.id, null);
      throw new UnauthorizedException('Refresh token geçersiz, tekrar giriş yapın.');
    }

    const tokens = await this.tokenUret(user);
    return { ...tokens, user: this.guvenliKullanici(user) };
  }

  async logout(userId: string) {
    await this.repository.setRefreshTokenHash(userId, null);
    return { message: 'Çıkış yapıldı.' };
  }

  async me(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }
    return this.guvenliKullanici(user);
  }

  private async tokenUret(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TTL,
    });
    // jti: aynı saniyede üretilen refresh token'ların bile farklı olmasını sağlar
    const refresh_token = await this.jwtService.signAsync(
      { sub: user.id, jti: randomUUID() },
      { secret: this.refreshSecret(), expiresIn: REFRESH_TTL },
    );
    await this.repository.setRefreshTokenHash(user.id, this.tokenHash(refresh_token));
    return { access_token, refresh_token };
  }

  private refreshSecret() {
    const s = process.env.JWT_REFRESH_SECRET;
    if (!s) throw new Error('JWT_REFRESH_SECRET tanımlı değil.');
    return s;
  }

  // bcrypt 72 byte'tan sonrasını yok saydığı için JWT'lerde güvenilmez; SHA-256 kullanılır.
  private tokenHash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashEslesiyor(token: string, saklanan: string) {
    const a = Buffer.from(this.tokenHash(token));
    const b = Buffer.from(saklanan);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private guvenliKullanici<T extends { sifreHash: string; refreshTokenHash?: string | null }>(
    user: T,
  ) {
    const { sifreHash: _s, refreshTokenHash: _r, ...rest } = user;
    return rest;
  }
}
