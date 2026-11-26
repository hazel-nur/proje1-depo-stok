import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const SATINALMA_DURUMLARI = [
  'BEKLIYOR',
  'ONAYLANDI',
  'REDDEDILDI',
  'TESLIM_ALINDI',
  'IPTAL',
] as const;

export class QueryPurchaseRequestsDto {
  @ApiPropertyOptional({ enum: SATINALMA_DURUMLARI })
  @IsOptional()
  @IsIn(SATINALMA_DURUMLARI)
  durum?: (typeof SATINALMA_DURUMLARI)[number];
}
