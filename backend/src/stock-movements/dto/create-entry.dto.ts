import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

// Stok giriş / çıkış için ortak gövde
export class CreateStockEntryDto {
  @ApiProperty({ description: 'Ürün id' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Depo id' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  miktar: number;

  @ApiPropertyOptional({ example: 'Sayım sonrası düzeltme' })
  @IsOptional()
  @IsString()
  aciklama?: string;
}
