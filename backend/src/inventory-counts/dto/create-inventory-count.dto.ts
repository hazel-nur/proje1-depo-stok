import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CountItemDto {
  @ApiProperty({ description: 'Ürün id' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 42, description: 'Rafta fiilen sayılan miktar (gerçek)' })
  @IsInt()
  @Min(0)
  sayilanMiktar: number;
}

export class CreateInventoryCountDto {
  @ApiProperty({ description: 'Sayım yapılan depo id' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional({ example: 'Aralık ayı sayımı' })
  @IsOptional()
  @IsString()
  aciklama?: string;

  @ApiProperty({ type: [CountItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'En az bir kalem gerekli.' })
  @ValidateNested({ each: true })
  @Type(() => CountItemDto)
  items: CountItemDto[];
}
