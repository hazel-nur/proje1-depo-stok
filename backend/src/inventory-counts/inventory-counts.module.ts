import { Module } from '@nestjs/common';
import { InventoryCountsController } from './inventory-counts.controller';
import { InventoryCountsService } from './inventory-counts.service';
import { InventoryCountsRepository } from './inventory-counts.repository';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, StockMovementsModule],
  controllers: [InventoryCountsController],
  providers: [InventoryCountsService, InventoryCountsRepository],
})
export class InventoryCountsModule {}
