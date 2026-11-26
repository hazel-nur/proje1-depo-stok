import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ROLLER } from '../../auth/roles.constants';

export { ROLLER };

export class UpdateRoleDto {
  @ApiProperty({ enum: ROLLER, example: 'Depo Personeli' })
  @IsIn(ROLLER, { message: 'Geçersiz rol.' })
  role: string;
}
