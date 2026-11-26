import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { ad: string; email: string; sifreHash: string; role: string }) {
    return this.prisma.user.create({ data });
  }

  setRefreshTokenHash(id: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({ where: { id }, data: { refreshTokenHash } });
  }
}
