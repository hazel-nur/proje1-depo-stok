import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ROLLER } from '../../auth/roles.constants';

export class CreateUserDto {
  @ApiProperty({ example: 'Ayşe Yılmaz' })
  @IsString()
  @IsNotEmpty()
  ad: string;

  @ApiProperty({ example: 'ayse@depo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Sifre123!' })
  @IsString()
  @MinLength(6)
  sifre: string;

  @ApiProperty({ enum: ROLLER, example: 'Depo Personeli' })
  @IsIn(ROLLER, { message: 'Geçersiz rol.' })
  role: string;
}
