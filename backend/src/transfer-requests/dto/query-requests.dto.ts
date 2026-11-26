import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class QueryTransferRequestsDto {
  @ApiPropertyOptional({ enum: ['BEKLIYOR', 'ONAYLANDI', 'REDDEDILDI', 'IPTAL'] })
  @IsOptional()
  @IsIn(['BEKLIYOR', 'ONAYLANDI', 'REDDEDILDI', 'IPTAL'])
  durum?: 'BEKLIYOR' | 'ONAYLANDI' | 'REDDEDILDI' | 'IPTAL';
}
