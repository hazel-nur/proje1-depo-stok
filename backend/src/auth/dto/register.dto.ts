import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Herkese açık kayıt: rol alanı YOKTUR, kayıt her zaman "Depo Personeli" olur.
// Yüksek yetkili hesapları sadece Admin oluşturur (POST /users).
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
}
