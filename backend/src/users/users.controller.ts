import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Users (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Yeni kullanıcı oluşturur (istenen rolle)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles('Admin')
  @ApiOperation({ summary: 'Aktif kullanıcıları listeler' })
  findAll() {
    return this.usersService.findAll();
  }

  // ÖNEMLİ: Bu uç, ':id' ucundan ÖNCE durmalı
  @Get('deleted')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş (soft delete) kullanıcıları listeler - Admin' })
  findAllDeleted() {
    return this.usersService.findAllDeleted();
  }

  @Get(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Tek kullanıcı getirir' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @Roles('Admin')
  @ApiOperation({ summary: 'Kullanıcı rolünü değiştirir' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.usersService.updateRole(id, dto.role, req.user.sub);
  }

  @Patch(':id/restore')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş kullanıcıyı geri alır - Admin' })
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Kullanıcı soft delete (deletedAt yazılır)' })
  softDelete(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.usersService.softDelete(id, req.user.sub);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  @ApiOperation({ summary: 'Kullanıcı kalıcı siler (hard delete) - Admin' })
  hardDelete(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.usersService.hardDelete(id, req.user.sub);
  }
}