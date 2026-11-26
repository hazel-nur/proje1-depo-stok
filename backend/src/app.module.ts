import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma.module';
import { AllExceptionsFilter } from './shared/all-exceptions.filter';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { WarehouseStocksModule } from './warehouse-stocks/warehouse-stocks.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { TransferRequestsModule } from './transfer-requests/transfer-requests.module';
import { PurchaseRequestsModule } from './purchase-requests/purchase-requests.module';
import { InventoryCountsModule } from './inventory-counts/inventory-counts.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Genel hız sınırı: IP başına dakikada THROTTLE_LIMIT istek (varsayılan 300)
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: Number(process.env.THROTTLE_LIMIT ?? 300) },
    ]),
    PrismaModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    UsersModule,
    WarehousesModule,
    SuppliersModule,
    WarehouseStocksModule,
    StockMovementsModule,
    TransferRequestsModule,
    PurchaseRequestsModule,
    InventoryCountsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
