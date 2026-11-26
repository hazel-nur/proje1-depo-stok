import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryMovementsDto {
  @ApiPropertyOptional({ enum: ['GIRIS', 'CIKIS', 'TRANSFER'] })
  @IsOptional()
  @IsIn(['GIRIS', 'CIKIS', 'TRANSFER'])
  tip?: 'GIRIS' | 'CIKIS' | 'TRANSFER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Kaynak ya da hedef depo' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional({ default: 100, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
