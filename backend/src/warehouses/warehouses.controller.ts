import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Depo oluşturur' })
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Aktif depoları listeler' })
  findAll() {
    return this.warehousesService.findAll();
  }

  // ÖNEMLİ: Bu uç, ':id' ucundan ÖNCE durmalı
  @Get('deleted')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş (soft delete) depoları listeler - Admin' })
  findAllDeleted() {
    return this.warehousesService.findAllDeleted();
  }

  @Get(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Tek depo getirir' })
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Depo günceller' })
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto);
  }

  @Patch(':id/restore')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş depoyu geri alır - Admin' })
  restore(@Param('id') id: string) {
    return this.warehousesService.restore(id);
  }

  @Delete(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Depo soft delete (deletedAt yazılır)' })
  softDelete(@Param('id') id: string) {
    return this.warehousesService.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  @ApiOperation({ summary: 'Depo kalıcı siler (hard delete) - Admin' })
  hardDelete(@Param('id') id: string) {
    return this.warehousesService.hardDelete(id);
  }
}
