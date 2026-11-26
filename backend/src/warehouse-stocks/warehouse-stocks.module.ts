import { Module } from '@nestjs/common';
import { WarehouseStocksController } from './warehouse-stocks.controller';
import { WarehouseStocksService } from './warehouse-stocks.service';
import { WarehouseStocksRepository } from './warehouse-stocks.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WarehouseStocksController],
  providers: [WarehouseStocksService, WarehouseStocksRepository],
})
export class WarehouseStocksModule {}
