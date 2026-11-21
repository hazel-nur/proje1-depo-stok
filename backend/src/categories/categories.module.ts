import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { PrismaService } from '../shared/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository, PrismaService],
})
export class CategoriesModule {}