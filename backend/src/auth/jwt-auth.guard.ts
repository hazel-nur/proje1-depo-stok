import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token bulunamadı.');
    }

    const [tip, token] = String(authHeader).split(' '); // "Bearer <token>" formatı
    if (tip !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token bulunamadı.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload; // sonraki kodların erişebilmesi için kullanıcı bilgisini request'e ekliyoruz
      return true;
    } catch {
      throw new UnauthorizedException('Token geçersiz veya süresi dolmuş.');
    }
  }
}