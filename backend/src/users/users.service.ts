import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private repository: UsersRepository) {}

  findAll() {
    return this.repository.findAllActive();
  }

  // Admin için: soft delete yapılmış kullanıcılar
  findAllDeleted() {
    return this.repository.findAllDeleted();
  }

  async findOne(id: string) {
    const kullanici = await this.repository.findById(id);
    if (!kullanici || kullanici.deletedAt !== null) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    return kullanici;
  }

  async updateRole(id: string, role: string, currentUserId: string) {
    await this.findOne(id);
    if (id === currentUserId) {
      throw new BadRequestException('Kendi rolünüzü değiştiremezsiniz.');
    }
    return this.repository.updateRole(id, role);
  }

  // SOFT DELETE: kayıt silinmez, deletedAt'e tarih yazılır
  async softDelete(id: string, currentUserId: string) {
    const kullanici = await this.findOne(id);
    await this.silmeKurallari(id, kullanici.role, currentUserId);
    return this.repository.markDeleted(id);
  }

  // GERİ ALMA: silinmiş kullanıcıyı tekrar aktif yapar
  async restore(id: string) {
    const kullanici = await this.repository.findById(id);
    if (!kullanici) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    if (kullanici.deletedAt === null) {
      throw new ConflictException('Bu kullanıcı zaten silinmemiş.');
    }
    return this.repository.restore(id);
  }

  // HARD DELETE: kayıt veritabanından tamamen silinir
  async hardDelete(id: string, currentUserId: string) {
    const kullanici = await this.repository.findById(id);
    if (!kullanici) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    // Zaten soft delete edilmiş Admin için son Admin kontrolü gerekmez
    if (kullanici.deletedAt === null) {
      await this.silmeKurallari(id, kullanici.role, currentUserId);
    } else if (id === currentUserId) {
      throw new BadRequestException('Kendinizi silemezsiniz.');
    }
    return this.repository.delete(id);
  }

  // Soft ve hard delete için ortak güvenlik kuralları
  private async silmeKurallari(id: string, role: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Kendinizi silemezsiniz.');
    }
    if (role === 'Admin') {
      const adminSayisi = await this.repository.countActiveAdmins();
      if (adminSayisi <= 1) {
        throw new ConflictException('Son Admin silinemez.');
      }
    }
  }
}