import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

// Şifre hash'i asla dışarı verilmez
const GUVENLI_ALANLAR = {
  id: true,
  ad: true,
  email: true,
  role: true,
  createdAt: true,
  deletedAt: true,
};

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: GUVENLI_ALANLAR,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllDeleted() {
    return this.prisma.user.findMany({
      where: { deletedAt: { not: null } },
      select: GUVENLI_ALANLAR,
      orderBy: { deletedAt: 'desc' },
    });
  }

  // Silinmiş olsun olmasın tek kullanıcı
  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: GUVENLI_ALANLAR,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: { ad: string; email: string; sifreHash: string; role: string }) {
    return this.prisma.user.create({ data, select: GUVENLI_ALANLAR });
  }

  updateRole(id: string, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role, refreshTokenHash: null },
      select: GUVENLI_ALANLAR,
    });
  }

  markDeleted(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), refreshTokenHash: null },
      select: GUVENLI_ALANLAR,
    });
  }

  restore(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      select: GUVENLI_ALANLAR,
    });
  }

  delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  // Silinmemiş Admin sayısı (son Admin'in silinmesini engellemek için)
  countActiveAdmins() {
    return this.prisma.user.count({
      where: { role: 'Admin', deletedAt: null },
    });
  }
}