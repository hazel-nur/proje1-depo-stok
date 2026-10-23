import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  softDelete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  hardDelete(@Param('id') id: string) {
    return this.productsService.hardDelete(id);
  }
}