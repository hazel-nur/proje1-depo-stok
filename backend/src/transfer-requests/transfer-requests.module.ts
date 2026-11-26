import { Module } from '@nestjs/common';
import { TransferRequestsController } from './transfer-requests.controller';
import { TransferRequestsService } from './transfer-requests.service';
import { TransferRequestsRepository } from './transfer-requests.repository';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, StockMovementsModule],
  controllers: [TransferRequestsController],
  providers: [TransferRequestsService, TransferRequestsRepository],
})
export class TransferRequestsModule {}
