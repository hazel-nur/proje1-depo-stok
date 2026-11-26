import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PurchaseRequestsService } from './purchase-requests.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { QueryPurchaseRequestsDto } from './dto/query-purchase-requests.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthRequest } from '../auth/roles.constants';

@ApiTags('Purchase Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-requests')
export class PurchaseRequestsController {
  constructor(private readonly service: PurchaseRequestsService) {}

  @Post()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu')
  @ApiOperation({ summary: 'Satın alma talebi oluşturur (kalemleriyle; durum: BEKLIYOR)' })
  create(@Body() dto: CreatePurchaseRequestDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Aktif satın alma taleplerini listeler (?durum=)' })
  findAll(@Query() q: QueryPurchaseRequestsDto) {
    return this.service.findAll(q.durum);
  }

  // ÖNEMLİ: Bu uç, ':id' ucundan ÖNCE durmalı
  @Get('deleted')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş (soft delete) satın alma taleplerini listeler - Admin' })
  findAllDeleted() {
    return this.service.findAllDeleted();
  }

  @Get(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Tek satın alma talebi getirir' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/approve')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Talebi onaylar (BEKLIYOR -> ONAYLANDI)' })
  approve(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.service.approve(id, req.user.sub);
  }

  @Patch(':id/reject')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Talebi reddeder (BEKLIYOR -> REDDEDILDI)' })
  reject(@Param('id') id: string, @Body() dto: RejectPurchaseRequestDto, @Req() req: AuthRequest) {
    return this.service.reject(id, req.user.sub, dto.redNedeni);
  }

  @Patch(':id/receive')
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({
    summary: 'Teslim alır (ONAYLANDI -> TESLIM_ALINDI): kalemler hedef depoya stok girişi olur',
  })
  receive(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.service.receive(id, req.user.sub);
  }

  @Patch(':id/cancel')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu')
  @ApiOperation({ summary: 'Teslim alınmamış talebi iptal eder (Satın Alma sadece kendi talebini)' })
  cancel(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.service.cancel(id, req.user.sub, req.user.role);
  }

  @Patch(':id/restore')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş satın alma talebini geri alır - Admin' })
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Delete(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Satın alma talebi soft delete (deletedAt yazılır)' })
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  @ApiOperation({ summary: 'Satın alma talebi kalıcı siler (hard delete) - Admin' })
  hardDelete(@Param('id') id: string) {
    return this.service.hardDelete(id);
  }
}
