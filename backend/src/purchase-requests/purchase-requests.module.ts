import { Module } from '@nestjs/common';
import { PurchaseRequestsController } from './purchase-requests.controller';
import { PurchaseRequestsService } from './purchase-requests.service';
import { PurchaseRequestsRepository } from './purchase-requests.repository';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, StockMovementsModule],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService, PurchaseRequestsRepository],
})
export class PurchaseRequestsModule {}
