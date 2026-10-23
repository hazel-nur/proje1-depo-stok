import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, ProductsModule, CategoriesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}