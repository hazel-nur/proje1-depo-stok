import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu')
  @ApiOperation({ summary: 'Ürün oluşturur' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Aktif ürünleri listeler' })
  findAll() {
    return this.productsService.findAll();
  }

  // ÖNEMLİ: Bu uç, ':id' ucundan ÖNCE durmalı
  @Get('deleted')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş (soft delete) ürünleri listeler - Admin' })
  findAllDeleted() {
    return this.productsService.findAllDeleted();
  }

  @Get(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Tek ürün getirir' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu')
  @ApiOperation({ summary: 'Ürün günceller' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/restore')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş ürünü geri alır - Admin' })
  restore(@Param('id') id: string) {
    return this.productsService.restore(id);
  }

  @Delete(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Ürün soft delete (deletedAt yazılır)' })
  softDelete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  @ApiOperation({ summary: 'Ürün kalıcı siler (hard delete) - Admin' })
  hardDelete(@Param('id') id: string) {
    return this.productsService.hardDelete(id);
  }
}