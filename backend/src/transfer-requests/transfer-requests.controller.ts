import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransferRequestsService } from './transfer-requests.service';
import { CreateTransferRequestDto } from './dto/create-transfer-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { QueryTransferRequestsDto } from './dto/query-requests.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthRequest } from '../auth/roles.constants';

@ApiTags('Transfer Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transfer-requests')
export class TransferRequestsController {
  constructor(private readonly service: TransferRequestsService) {}

  @Post()
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Transfer talebi açar (durum: BEKLIYOR)' })
  create(@Body() dto: CreateTransferRequestDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Aktif transfer taleplerini listeler (?durum=)' })
  findAll(@Query() q: QueryTransferRequestsDto) {
    return this.service.findAll(q.durum);
  }

  // ÖNEMLİ: Bu uç, ':id' ucundan ÖNCE durmalı
  @Get('deleted')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş (soft delete) transfer taleplerini listeler - Admin' })
  findAllDeleted() {
    return this.service.findAllDeleted();
  }

  @Get(':id')
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Tek transfer talebi getirir' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/approve')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Talebi onaylar ve transferi tek transaction ile uygular' })
  approve(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.service.approve(id, req.user.sub);
  }

  @Patch(':id/reject')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Talebi reddeder' })
  reject(@Param('id') id: string, @Body() dto: RejectRequestDto, @Req() req: AuthRequest) {
    return this.service.reject(id, req.user.sub, dto.redNedeni);
  }

  @Patch(':id/cancel')
  @Roles('Admin', 'Şube Yöneticisi', 'Depo Personeli')
  @ApiOperation({ summary: 'Bekleyen talebi iptal eder (Depo Personeli sadece kendi talebini)' })
  cancel(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.service.cancel(id, req.user.sub, req.user.role);
  }

  @Patch(':id/restore')
  @Roles('Admin')
  @ApiOperation({ summary: 'Silinmiş transfer talebini geri alır - Admin' })
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Delete(':id')
  @Roles('Admin', 'Şube Yöneticisi')
  @ApiOperation({ summary: 'Transfer talebi soft delete (deletedAt yazılır)' })
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  @ApiOperation({ summary: 'Transfer talebi kalıcı siler (hard delete) - Admin' })
  hardDelete(@Param('id') id: string) {
    return this.service.hardDelete(id);
  }
}
