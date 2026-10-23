import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('Admin', 'Şube Yöneticisi')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  softDelete(@Param('id') id: string) {
    return this.categoriesService.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  hardDelete(@Param('id') id: string) {
    return this.categoriesService.hardDelete(id);
  }
}