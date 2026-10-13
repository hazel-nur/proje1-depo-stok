import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // @Roles() ile işaretlenmemişse herkes girebilir
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // JwtAuthGuard'ın request'e eklediği kullanıcı bilgisi

    return requiredRoles.includes(user.role);
  }
}