import { Body, Controller, Post, Get, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { ADMIN } from './roles.constants';
import type { AuthRequest } from './roles.constants';

// Giriş denemeleri sıkı sınırlanır (kaba kuvvet saldırısına karşı)
const siki = () => ({
  default: { limit: Number(process.env.AUTH_THROTTLE_LIMIT ?? 20), ttl: 60_000 },
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle(siki())
  @ApiOperation({ summary: 'Herkese açık kayıt (rol her zaman Depo Personeli olur)' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle(siki())
  @ApiOperation({
    summary: 'Giriş yapar; access token (15 dk) ve refresh token (7 gün) döndürür',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle(siki())
  @ApiOperation({
    summary: 'Refresh token ile yeni token çifti alır (rotation: eski refresh token geçersiz olur)',
  })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Çıkış yapar, refresh token geçersiz kılınır' })
  async logout(@Req() req: AuthRequest) {
    return this.authService.logout(req.user.sub);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Giriş yapmış kullanıcının profilini döndürür' })
  async me(@Req() req: AuthRequest) {
    return this.authService.me(req.user.sub);
  }

  @Get('admin-test')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sadece Admin rolündeki kullanıcıların erişebildiği deneme endpoint'i" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN)
  async adminTest(@Req() req: AuthRequest) {
    return {
      message: "Tebrikler, Admin olarak bu korumalı endpoint'e erişebildin!",
      kullanici: req.user,
    };
  }
}
