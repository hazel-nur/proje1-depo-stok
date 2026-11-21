import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
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

  @Get()
  @Roles('Admin')
  findAll() {
    return this.usersService.findAll();
  }

  // ÖNEMLİ: Bu uç, ':id' ucundan ÖNCE durmalı
  @Get('deleted')
  @Roles('Admin')
  findAllDeleted() {
    return this.usersService.findAllDeleted();
  }

  @Get(':id')
  @Roles('Admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @Roles('Admin')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.usersService.updateRole(id, dto.role, req.user.sub);
  }

  @Patch(':id/restore')
  @Roles('Admin')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Delete(':id')
  @Roles('Admin')
  softDelete(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.usersService.softDelete(id, req.user.sub);
  }

  @Delete(':id/hard')
  @Roles('Admin')
  hardDelete(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.usersService.hardDelete(id, req.user.sub);
  }
}