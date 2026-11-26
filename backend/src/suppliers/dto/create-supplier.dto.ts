import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Anadolu Tedarik A.Ş.' })
  @IsString()
  @IsNotEmpty()
  ad: string;

  @ApiPropertyOptional({ example: 'satis@anadolutedarik.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '0212 555 00 00' })
  @IsOptional()
  @IsString()
  telefon?: string;

  @ApiPropertyOptional({ example: 'Ankara' })
  @IsOptional()
  @IsString()
  adres?: string;
}
