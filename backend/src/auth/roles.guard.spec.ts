import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const ctx = (role?: string) =>
  ({
    getHandler: () => 'h',
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  }) as any;

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('rol yetkiliyse geçer, değilse 403', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['Admin']);
    expect(guard.canActivate(ctx('Admin'))).toBe(true);
    expect(() => guard.canActivate(ctx('Depo Personeli'))).toThrow(ForbiddenException);
  });

  it('@Roles yoksa herkes geçer', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    expect(guard.canActivate(ctx('Depo Personeli'))).toBe(true);
  });
});
