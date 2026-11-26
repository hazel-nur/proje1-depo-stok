import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockEntryDto } from './dto/create-entry.dto';
import { CreateTransferMovementDto } from './dto/create-transfer-movement.dto';
import { QueryMovementsDto } from './dto/query-movements.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthRequest } from '../auth/roles.constants';

// Stok hareketleri değiştirilmez/silinmez (denetim izi): sadece oluştur ve oku.
@ApiTags('Stock Movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly service: StockMovementsService) {}

  @Post('entry')
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Stok girişi (depoya mal girer; tek transaction)' })
  entry(@Body() dto: CreateStockEntryDto, @Req() req: AuthRequest) {
    return this.service.giris(dto, req.user.sub);
  }

  @Post('exit')
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Stok çıkışı (stok yetersizse 409)' })
  exit(@Body() dto: CreateStockEntryDto, @Req() req: AuthRequest) {
    return this.service.cikis(dto, req.user.sub);
  }

  @Post('transfer')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({
    summary: 'Doğrudan depolar arası transfer (onay gerektirmez; Depo Personeli transfer talebi açmalı)',
  })
  transfer(@Body() dto: CreateTransferMovementDto, @Req() req: AuthRequest) {
    return this.service.transfer(dto, req.user.sub);
  }

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Stok hareketlerini listeler (tip/ürün/depo filtresi)' })
  findAll(@Query() q: QueryMovementsDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Tek stok hareketi getirir' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
