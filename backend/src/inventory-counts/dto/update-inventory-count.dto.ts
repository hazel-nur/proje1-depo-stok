import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CountItemDto } from './create-inventory-count.dto';

// Sadece uygulanmamış (ACIK) sayım güncellenebilir; items verilirse tüm kalemler yenilenir
export class UpdateInventoryCountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aciklama?: string;

  @ApiPropertyOptional({ type: [CountItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CountItemDto)
  items?: CountItemDto[];
}
