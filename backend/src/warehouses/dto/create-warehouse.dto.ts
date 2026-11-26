import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Ana Depo' })
  @IsString()
  @IsNotEmpty()
  ad: string;

  @ApiPropertyOptional({ example: 'İstanbul' })
  @IsOptional()
  @IsString()
  sehir?: string;

  @ApiPropertyOptional({ example: 'Organize Sanayi Bölgesi 3. Cadde No:5' })
  @IsOptional()
  @IsString()
  adres?: string;
}
