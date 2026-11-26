import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransferMovementDto {
  @ApiProperty({ description: 'Ürün id' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Kaynak depo id' })
  @IsString()
  @IsNotEmpty()
  sourceWarehouseId: string;

  @ApiProperty({ description: 'Hedef depo id' })
  @IsString()
  @IsNotEmpty()
  targetWarehouseId: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsInt()
  @Min(1)
  miktar: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aciklama?: string;
}
