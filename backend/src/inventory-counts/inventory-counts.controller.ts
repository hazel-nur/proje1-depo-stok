import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryCountsService } from './inventory-counts.service';
import { CreateInventoryCountDto } from './dto/create-inventory-count.dto';
import { UpdateInventoryCountDto } from './dto/update-inventory-count.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthRequest } from '../auth/roles.constants';

@ApiTags('Inventory Counts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory-counts')
export class InventoryCountsController {
  constructor(private readonly service: InventoryCountsService) {}

  @Post()
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Sayım girişi oluşturur (beklenen miktar depodan otomatik alınır)' })
  create(@Body() dto: CreateInventoryCountDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Aktif sayımları listeler' })
  findAll() {
    return this.service.findAll();
  }

  // ÖNEMLİ: Bu uç, ':id' ucundan ÖNCE durmalı
  @Get('deleted')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş (soft delete) sayımları listeler - Admin' })
  findAllDeleted() {
    return this.service.findAllDeleted();
  }

  @Get(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Tek sayım (kalemleri ve farklarıyla) getirir' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Uygulanmamış sayımın açıklama/kalemlerini günceller' })
  update(@Param('id') id: string, @Body() dto: UpdateInventoryCountDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/apply')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({
    summary: 'Sayımı uygular: fark (gerçek − beklenen) kadar stok hareketi yazar, stoğu düzeltir',
  })
  apply(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.service.apply(id, req.user.sub);
  }

  @Patch(':id/restore')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş sayımı geri alır - Admin' })
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Delete(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Sayım soft delete (deletedAt yazılır)' })
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  @ApiOperation({ summary: 'Sayım kalıcı siler (hard delete) - Admin' })
  hardDelete(@Param('id') id: string) {
    return this.service.hardDelete(id);
  }
}
