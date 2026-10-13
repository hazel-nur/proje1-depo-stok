import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Hazel Nur' })
  @IsString()
  @IsNotEmpty()
  ad: string;

  @ApiProperty({ example: 'hazel@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  sifre: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  role: string;
}