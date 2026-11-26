import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WarehouseStocksService } from './warehouse-stocks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Warehouse Stocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse-stocks')
export class WarehouseStocksController {
  constructor(private readonly service: WarehouseStocksService) {}

  @Get()
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Depo başına stok listesi (?warehouseId= &productId=)' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  findAll(@Query('warehouseId') warehouseId?: string, @Query('productId') productId?: string) {
    return this.service.findAll({ warehouseId, productId });
  }

  @Get('low')
  @Roles('Admin', 'Şube Yöneticisi', 'Satın Alma Sorumlusu', 'Depo Personeli')
  @ApiOperation({ summary: 'Düşük stok: toplam stoğu minimum seviyenin altındaki ürünler' })
  findLow() {
    return this.service.findLowStock();
  }
}
