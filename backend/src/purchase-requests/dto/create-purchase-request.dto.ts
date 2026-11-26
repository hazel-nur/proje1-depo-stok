import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseItemDto {
  @ApiProperty({ description: 'Ürün id' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 20, minimum: 1 })
  @IsInt()
  @Min(1)
  miktar: number;

  @ApiProperty({ example: 150.5, description: 'Birim alış fiyatı' })
  @IsNumber()
  @Min(0)
  birimFiyat: number;
}

export class CreatePurchaseRequestDto {
  @ApiProperty({ description: 'Tedarikçi id' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ description: 'Malın teslim alınacağı depo id' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional({ example: 'Aylık yenileme siparişi' })
  @IsOptional()
  @IsString()
  aciklama?: string;

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'En az bir kalem gerekli.' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
