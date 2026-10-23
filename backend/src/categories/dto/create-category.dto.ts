import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Elektronik' })
  @IsString()
  @IsNotEmpty()
  ad: string;

  @ApiPropertyOptional({ example: 'Elektronik ürünler' })
  @IsOptional()
  @IsString()
  aciklama?: string;
}