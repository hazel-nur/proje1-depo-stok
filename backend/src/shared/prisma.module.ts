import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Tek bir PrismaService (tek bağlantı havuzu) tüm modüllere sağlanır.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
