import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const ROLLER = [
  'Depo Personeli',
  'Satın Alma Sorumlusu',
  'Şube Yöneticisi',
  'Admin',
];

export class UpdateRoleDto {
  @ApiProperty({ enum: ROLLER, example: 'Depo Personeli' })
  @IsIn(ROLLER, { message: 'Geçersiz rol.' })
  role: string;
}