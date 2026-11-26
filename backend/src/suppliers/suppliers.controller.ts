import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu')
  @ApiOperation({ summary: 'Tedarikçi oluşturur' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Aktif tedarikçileri listeler' })
  findAll() {
    return this.suppliersService.findAll();
  }

  // ÖNEMLİ: Bu uç, ':id' ucundan ÖNCE durmalı
  @Get('deleted')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş (soft delete) tedarikçileri listeler - Admin' })
  findAllDeleted() {
    return this.suppliersService.findAllDeleted();
  }

  @Get(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Tek tedarikçi getirir' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu')
  @ApiOperation({ summary: 'Tedarikçi günceller' })
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Patch(':id/restore')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş tedarikçiyi geri alır - Admin' })
  restore(@Param('id') id: string) {
    return this.suppliersService.restore(id);
  }

  @Delete(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Tedarikçi soft delete (deletedAt yazılır)' })
  softDelete(@Param('id') id: string) {
    return this.suppliersService.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  @ApiOperation({ summary: 'Tedarikçi kalıcı siler (hard delete) - Admin' })
  hardDelete(@Param('id') id: string) {
    return this.suppliersService.hardDelete(id);
  }
}
