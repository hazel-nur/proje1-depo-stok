import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Dizüstü Bilgisayar' })
  @IsString()
  @IsNotEmpty()
  ad: string;

  @ApiProperty({ example: 'ELK-001', description: 'Benzersiz stok kodu' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({ example: '15 inç, 16GB RAM' })
  @IsOptional()
  @IsString()
  aciklama?: string;

  @ApiPropertyOptional({ example: 'adet' })
  @IsOptional()
  @IsString()
  birim?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  fiyat: number;

  @ApiPropertyOptional({ example: 5, description: 'Stok bu sayının altına inerse uyarı verilecek' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStokSeviyesi?: number;

  @ApiProperty({ description: 'Ürünün kategorisinin id\'si' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}